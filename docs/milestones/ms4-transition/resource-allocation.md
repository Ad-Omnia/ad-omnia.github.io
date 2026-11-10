---
title: Resource allocation and routing
date: 2026-11-04
order: 1
description: Formal problem behind the tactical recommendation engine, the approaches compared and the decision
---

# Resource allocation and routing

<p class="ad-lede">The tactical recommendation engine proposes which resources to send, move or release, by which route, and when they should arrive (US-7). This document defines that problem before it is implemented: its inputs, constraints and objective, the approaches compared, the one chosen, and what it needs from the predictive engine.</p>

## Decision summary

- **Two decision loops.** A fast loop recommends dispatches in seconds. A slow loop uses forecasts to work out how much each available unit is worth where it stands, and recommends repositioning.
- **Fast loop.** An assignment model with side constraints, solved by CP-SAT from [Google OR-Tools][cpsat]{ .ad-cite } under a short time limit.
- **Slow loop.** Scenarios sampled from the predictive engine are simulated to build a table of unit values per zone and type, which prices the cost of taking a unit away.
- **Informed fallback.** A greedy rule that uses the same costs and the same value table. If the solver cannot answer, the recommendation still takes forecasts into account.
- **Routing.** Self-hosted [Valhalla][valhalla]{ .ad-cite } over OpenStreetMap data, with OSRM as the fallback if the checks in [Conditions on this decision](#conditions-on-this-decision) fail.
- **General and specialist models.** General prediction models, such as wildfires, run in the platform for every entity that uses the private application. Specialist models for restricted data, such as offence data and health data, are managed by plugins. All forecasts reach the engine in the same format.
- **One recommendation model per agency.** Each agency has its own rules, priorities and evaluation, on top of a shared solver, fallback and routing service.
- **Core engine.** The engine reads core entities and nothing from a plugin's own data. Rules that need an agency's own data can be added through a plugin contract.
- **People decide.** The engine only produces recommendations. Nothing is applied until an operator accepts or adjusts it (FR-REC-3).

The model has not been run yet. The size, time and quality figures below are targets, not measurements.

## The problem

When an incident needs a response, an operator has to answer three questions under pressure: which units go, which route they take, and what the choice costs elsewhere. The last question is the hard one. Several incidents can compete for the same units, and a unit sent now is not available for the next call, so a good answer depends on what is likely to happen next.

| Reference | What it requires |
| --- | --- |
| FR-REC-1 | Recommendations to assign or release resources, each with a justification |
| FR-REC-2 | Routes and estimated arrival times over the road network |
| FR-REC-3 | Applied only after explicit operator confirmation, with the decision stored |
| UC-13, alternative flow 3a | If no route can be computed, the recommendation is shown without one and says why |
| NFR-AVL-2 | If the engine fails, the failure is shown and the rest of the platform keeps working |
| NFR-AVL-3 | The private application keeps working without internet access |
| NFR-PERF-2 | The reference scale for a major incident: 500 incidents and 2500 resources |

### What kind of problem it is

Emergency units do not make delivery-style tours with several stops chosen by an optimiser. Their journeys follow a fixed pattern, out to an incident and back. Three consequences shape this document:

1. **Routing and allocation separate cleanly.** Routing supplies a travel time for each pair, so it does not need to be solved together with allocation.
2. **Today's choice is an assignment problem.** Matching units to demand is well understood, and exact methods solve the basic form in polynomial time.
3. **The future turns it into a stochastic problem.** A choice now changes what can be done later, so the model needs a price for what a unit could still do where it is. This is where predictions enter.

### Scope

The engine follows the [data model](../ms2-elaboration/data-model.md) rule that the core never references a plugin. It reads only core entities and works for any entity that uses the private application.

Connector plugins translate data from providers into core entities, and the platform stores it. Most forecasts are then calculated by Ad Omnia's own models. Where a provider has more information than we could use ourselves, as with weather, we use its forecast instead. Forecasts therefore come from three places:

| Kind | Examples | Where it comes from | Who can use it | Data |
| --- | --- | --- | --- | --- |
| External forecast | Weather | Received from providers and combined in the platform (see [External forecasts](#external-forecasts)) | Any unit that uses the private application | Provider forecasts, through connectors installed in every deployment |
| General model | Wildfires | In the platform, in every private deployment | Any unit that uses the private application | Public sources, through connectors installed in every deployment, and the private database |
| Specialist model | Offence data, health data | In a plugin | The entity that has the plugin | Restricted data, kept in the plugin's own database |

Where a cause has neither, the platform uses historical rates and says so in the recommendation.

General and specialist models are both pre-trained and then refined locally. A model is delivered already trained, on public or synthetic data, so it works from the first day. Each private instance then refines it with its own data: the private database for general models, and the plugin's own database for specialist models. That data and the refined model stay in the instance. A refined version replaces the current one only if it performs better on recent local data, and the previous version is kept so it can be restored.

General and specialist models report the same outputs in the same format, stored as core Prediction records, so the engine does not need to know which model produced a forecast. A specialist plugin writes only aggregated forecasts, per zone and time window, with no personal data.

Forecasts and recommendations stay in the private application. The public application reads from its own database, and the private application's API sends it only what an operator has approved for publication (FR-PUB-1, NFR-SEC-2).

| Capability | How it is modelled | Calculated by Ad Omnia | Core data used |
| --- | --- | --- | --- |
| Current demand | Demand slots from a profile | Slots still open | Incident, Assignment |
| Future demand | Value table per zone and unit type | Demand forecast (general or specialist model) and value table | Incident, Observation, Risk Rating, Zone |
| Incident escalation | Anticipated slots, weighted by probability | Progression forecast (general or specialist model) | Incident, Observation, Prediction |
| Repositioning idle units | Separate decisions in the slow loop | Recommended moves | Asset, Agency location as the standby point |
| Reassigning a working unit | Candidate with a cost, reopening its current slot | Recommended reassignments | Assignment, Incident severity |
| Realistic speeds | Corrected travel times with uncertainty | Travel time correction | Observation of asset positions |
| Units that do not use roads | Straight-line distance and speed per unit type | Estimated arrival, with no route | Asset type and position |

Everything in this table still needs data to arrive through connectors. How good each forecast can be depends on the data available for each cause, but the method does not change.

### One recommendation model per agency

Agencies do not respond in the same way, so the recommendation model is specialised for each one. Each agency runs its own private instance. A model serves that agency and recommends only its units, but it can also see the tasks of other agencies on any event its agency has joined. All models share the same solver, fallback, routing service and method for valuing units.

| What is specialised | Example of how agencies can differ (illustrative) |
| --- | --- |
| Demand profiles and unit types | Several vehicles for a fire, one ambulance for a single casualty |
| Target arrival times | Minutes for a medical emergency, longer for a forest access road |
| Priority weights and penalties | How strongly severity outranks total travel time |
| Delay limit | An agency required to send the closest unit sets this limit to zero |
| Minimums per zone | Cover that must always remain in place |
| Eligibility rules | Which unit types may respond to which incidents and zones |
| Forecasts used | General models, plus the agency's specialist models |

**Information shared between agencies.** For now, sharing works per event, and sending is manual, because agencies need formal agreements and procedures before exchanging information. Operators must link every task, meaning an assignment or an order, to an event. Nothing leaves an instance until an operator sends it.

| Question | Proposed answer |
| --- | --- |
| Who can send to whom | Only agencies with an agreement in place. They are registered in each instance when the agreement is made, and each instance has its own key |
| Who can join an event | Only an agency that has received it. Its operator accepts the event, with or without having tasks on it, and agencies never browse a list of events |
| How two agencies know it is the same event | The event gets an identifier when first sent. The receiving operator links it to an existing incident or creates a new one |
| What is sent | A fixed form with the event's type and location and, per task, the unit type, status and arrival estimate. The operator reviews it before sending. Task text and data held by specialist plugins are not included |
| How it travels | The operator's action sends one encrypted message out to a small mailbox service, and the other instance collects it. Instances never accept inbound connections, and the mailbox cannot read the content |
| Without a connection | Messages wait and are sent when the connection returns, and the sender sees whether each was delivered. An operator can also export a signed file and deliver it through an approved channel |
| What happens if two agencies change something | Each agency only changes its own tasks, so the owner's latest version is always the right one |
| How it is recorded | Each send and each acceptance is logged with who, what, to whom, when and under which agreement |

A model uses this information to see how an event is already being responded to, which units another agency has committed and when they should arrive. Units from another agency that can fill a slot reduce that slot's demand, so the same need is not covered twice. Because updates are manual, the information is only as recent as the last send: each item shows its age, and past an age limit it no longer reduces demand and the recommendation warns about it.

These rules are versioned configuration held per agency. Rules that need data the core does not hold are added through a plugin. Each agency's model is reviewed and evaluated separately, because good results for one agency say nothing about another.

### Plugin extensions

Some useful capabilities depend on data or rules that belong to particular agencies, so they are left out of the core. They stay possible through a contract that the core defines and plugins implement. A plugin can:

- exclude an asset and slot pair, giving a reason;
- add to the cost of a pair, giving a reason;
- add demand slots to an incident;
- add details to a recommendation item, such as a destination;
- publish forecasts from a specialist model in the common format;
- bring in a new data source, translated into core entities such as Incident and Observation.

| Possible plugin | What it would add | Data it would bring |
| --- | --- | --- |
| Aerial means | Cycle time, endurance, and daylight and weather rules | Aircraft performance, water sources |
| Crew duty and fuel | Whether a unit can complete the job | Time on duty and endurance, per unit and never per person |
| Patient transport | Recommended hospital and the time the unit stays busy | Hospital capabilities and load |
| Traffic | Adjustment to travel times | A traffic feed, where internet access exists |
| CCTV analysis | Detected incidents, blocked roads and crowd levels | Camera feeds, processed inside the plugin. Only the results reach the core, never the video |
| Other new data sources | New observations that forecasts and recommendations can use | For example drone imagery, environmental sensors or satellite detections |

Plugin results reach the engine through the Plugin Validation Broker, and each one is recorded in the recommendation's justification. They are read in advance and never during a solve, so a slow or failing plugin cannot delay a recommendation. Plugins cannot create or apply recommendations.

## Input data

The engine works on a snapshot of the current state. Most of it is already in the data model, and the gaps are listed in [Impact on requirements and data model](#impact-on-requirements-and-data-model).

### Incidents

| Input | Source | Used for |
| --- | --- | --- |
| Type and severity | Incident | Demand profile and priority weight |
| Location or affected area | Incident | Destination, reduced to an access point on the road network |
| Status | Incident | Active and in-resolution incidents are considered. Closed ones release their units |
| Units already committed | Assignment, and other agencies' tasks on events the agency has joined | Subtracted from the demand |
| Rejected suggestions | Recommendation | A rejected unit is not suggested again for that incident until the situation changes |
| Progression | Prediction | Anticipated slots and areas that routes should avoid |

Each incident type and severity maps to a **demand profile**: a list of slots, where each slot is one unit needed, the unit types that can fill it, and a target arrival time. The first slot has the tightest target, because the first arrival usually matters most.

Profiles start from practitioner estimates and are refined from Assignment history as it builds up. History records what was sent, which may differ from what was needed, so it cannot be treated as the truth on its own.

### Resources

| Input | Source | Used for |
| --- | --- | --- |
| Type | Asset | Which slots the unit can fill |
| Agency | Asset | Whether the unit may be suggested for this incident |
| Status and current assignment | Asset, Assignment | Candidate for dispatch, release or reassignment |
| Last known position and last update | Asset | Start of the route, and how far it can be trusted |

Real positions of civil protection vehicles are not available to the project. The proof of concept will load a synthetic fleet as ordinary Asset records, alongside any assets that connectors provide, so results will describe the model's behaviour and not real operational performance.

### Locations

| Input | Source | Used for |
| --- | --- | --- |
| Zones and their boundaries | Zone (CAOP, see [Data source licenses](../ms3-construction/data-source-licenses.md)) | Value table and agency minimums |
| Standby points | Agency location | Where a unit can be repositioned |
| Access points | Derived | Nearest point on the road network to an incident, unit or forest area |

### Road network and travel times

| Input | Source | Used for |
| --- | --- | --- |
| Road graph with speeds and restrictions | OpenStreetMap extract for Portugal, held locally | Fastest routes |
| Correction by road class, hour and unit type | Learned from Observations | Default speeds are not those of a vehicle responding to an emergency |
| Areas to avoid | Other active incidents, projected areas, operator closures | Routes must not cross them |

### Predictions

The predictions below are calculated by the platform: by general models in the predictive engine (Module 6), and by specialist models in plugins. It works in three steps:

1. Providers send data, such as incident updates, and forecasts where they know more than we do, such as weather.
2. The platform stores it, which builds up the history.
3. The models calculate the predictions below from that history, the current data and the external forecasts, and the recommendation engine uses them.

This list is the contract each model implements for its cause, as far as its data allows, and it widens prediction from risk maps to a general view of demand. Forecasts for different causes are combined when scenarios are drawn. Until a model is trained, each prediction uses a simpler calculation from the same data, shown in the last column, so the recommendation engine does not have to wait for it.

| Prediction | Detail | Used for | Calculation until a model is trained |
| --- | --- | --- | --- |
| Incident arrivals | Rate per zone, type, severity and time window, with uncertainty | Scenarios | Historical rates, as in Risk Rating |
| Joint scenarios | Samples that keep dependence between zones, such as a dry, windy day causing many fires at once | Value table | Independent sampling from the rates |
| Escalation | Probability that an incident needs more units, and which ones | Anticipated slots | Historical pattern by type and severity |
| On-scene duration | Distribution per type and severity | How long a unit stays busy | Historical averages |
| Units needed | Suggested demand profile | Demand profiles | Practitioner estimates |
| Travel time correction | Distribution by road class, hour and unit type | Arrival estimates | Fixed factor per unit type |

Forecasts are judged by the decisions they lead to as well as by their error, following [Elmachtoub and Grigas][spo]{ .ad-cite }: a forecast is only better if it leads to better recommendations in simulation.

#### External forecasts

Ad Omnia does not calculate forecasts for which providers have more information than we do, such as weather. When several sources forecast the same variable, the platform uses their simple average. This assumes that all sources are reliable and equally accurate, which is a project decision and has not been measured.

- Sources are aligned to the same place and time before averaging.
- If a source is missing or out of date, the average uses the remaining ones and shows which were used.
- Directions, such as wind direction, use a circular average, because the plain average of 350° and 10° would wrongly give 180°.
- Values that are not numbers, such as warning levels, are not averaged. They are shown as each source gave them.
- The difference between sources is kept as a measure of uncertainty, and it is used when scenarios are drawn.

The combined forecast is stored as a Prediction linked to its Sources, and each source's attribution still applies.

## Formal model

### Fast loop: dispatch

This model is built once per agency. Its parameters come from that agency's rules, and its assets are that agency's units. Assets are matched to demand slots, and a slot with no suitable asset is reported as unmet. A surplus unit that no incident needs becomes a release recommendation.

**Sets and parameters**

| Symbol | Meaning |
| --- | --- |
| S | Demand slots: open confirmed slots, anticipated slots, and the slots of working units that could be reassigned |
| A, A(s) | Candidate assets, and those that may fill slot s |
| N<sub>z,c</sub> | Available units of type c in zone z |
| T<sub>a,s</sub> | Expected travel time of asset a to slot s, after correction |
| L<sub>a,s</sub> | Expected time past the target of slot s, from the distribution of the travel time |
| w<sub>s</sub> | Priority weight of the incident of slot s, from its severity |
| p<sub>s</sub> | Probability that an anticipated slot is really needed, 1 if confirmed |
| V<sub>z,c</sub>(n) | Value of the n-th available unit of type c in zone z, from the slow loop |
| r<sub>z,c</sub> | Agency minimum of type c in zone z |
| β<sub>a</sub> | Cost of taking a working unit from its current job |
| ε<sub>a,s</sub> | Penalty for weak evidence, such as an estimated route or an ageing position, plus any cost added by a plugin |
| ρ, γ | Weights on lateness and on a missed minimum |
| P, P<sub>f</sub> | Cost of an unfilled confirmed slot and of an unfilled anticipated slot, with P<sub>f</sub> lower than P |

**Decision variables**

| Variable | Meaning |
| --- | --- |
| x<sub>a,s</sub> ∈ {0, 1} | Asset a is recommended for slot s. For a working unit in its own slot, this means it stays |
| u<sub>s</sub> ∈ {0, 1} | Slot s stays unfilled |
| k<sub>z,c,n</sub> ∈ {0, 1} | The n-th unit of type c stays available in zone z |
| g<sub>z,c</sub> ≥ 0, integer | Shortfall against an agency minimum |

**Hard constraints** are never broken.

| Code | Rule | Formulation |
| --- | --- | --- |
| H1 | Each slot is filled once or reported as unfilled | Σ<sub>a ∈ A(s)</sub> x<sub>a,s</sub> + u<sub>s</sub> = 1, for every slot s |
| H2 | A unit goes to one place at most | Σ<sub>s</sub> x<sub>a,s</sub> ≤ 1, for every asset a |
| H3 | Only eligible units can fill a slot | x<sub>a,s</sub> exists only if a ∈ A(s) |
| H4 | Counts link dispatch to future value | Σ<sub>n</sub> k<sub>z,c,n</sub> = N<sub>z,c</sub> − Σ<sub>a in z, of type c</sub> Σ<sub>s</sub> x<sub>a,s</sub>, for every zone z and type c |

An asset belongs to A(s) only if all of these hold:

- Its type is accepted by the slot.
- It is available, surplus, or working on an incident of lower severity than the slot's. A reassignment reopens its current slot, because that slot stays in S, and it is always shown as a reassignment.
- It belongs to the agency this model serves, and that agency's rules allow its type to respond to this incident type and zone.
- Its last position is newer than the staleness limit.
- No installed plugin has excluded the pair.
- Its arrival is within the **delay limit** of the fastest eligible unit for that slot. This is the safety limit on forecasts: however valuable a unit looks for the future, it cannot make a real incident wait beyond this limit.
- The operator has not rejected it for this incident since the situation last changed.
- It is among the nearest candidates for that slot (see [Keeping it fast](#keeping-it-fast)).

**Soft constraint.** It is kept when possible and broken at a cost.

| Code | Rule | Formulation |
| --- | --- | --- |
| S1 | Respect agency minimums | N<sub>z,c</sub> − Σ<sub>a in z, of type c</sub> Σ<sub>s</sub> x<sub>a,s</sub> + g<sub>z,c</sub> ≥ r<sub>z,c</sub> |

Because any slot can be reported as unfilled, the model always has a solution. When there are too few units, the result shows which demand is unmet instead of failing.

**Objective function.** The model minimises:

<p>Σ<sub>s</sub> Σ<sub>a ∈ A(s)</sub> c<sub>a,s</sub> x<sub>a,s</sub> + Σ<sub>s</sub> π<sub>s</sub> u<sub>s</sub> + γ Σ<sub>z,c</sub> g<sub>z,c</sub> − Σ<sub>z,c,n</sub> V<sub>z,c</sub>(n) k<sub>z,c,n</sub></p>

where:

<p>c<sub>a,s</sub> = w<sub>s</sub> · ( T<sub>a,s</sub> + ρ · L<sub>a,s</sub> ) + β<sub>a</sub> + ε<sub>a,s</sub></p>

<p>π<sub>s</sub> = w<sub>s</sub> · P for a confirmed slot, and π<sub>s</sub> = p<sub>s</sub> · w<sub>s</sub> · P<sub>f</sub> for an anticipated slot</p>

In plain terms:

1. **Meet confirmed demand.** P is larger than any other cost, and V is capped below it, so an eligible idle unit is never held back while a confirmed slot stays empty.
2. **Arrive on time.** Time past the target counts more than time before it, and the first slot has the tightest target.
3. **Prepare for what is likely.** Anticipated slots and future value compete with travel time, in proportion to their probability.
4. **Disturb as little as possible.** Moving working units and relying on weak evidence both cost something.

The travel terms are known before solving, and V falls as n grows, so the model stays linear and the solver naturally keeps the most valuable units in place.

### Slow loop: future value and repositioning

The slow loop runs every few minutes and when a forecast changes. It has two outputs.

**Value table.** It draws a set of scenarios Ω from the predictive engine, each with future incidents, escalations, on-scene durations and travel conditions. This follows the [sample average approximation][saa]{ .ad-cite }: a hard expectation is replaced by an average over samples. For a scenario ω, C<sup>ω</sup> is the weighted lateness and unmet demand when the fallback policy handles that scenario:

<p>V<sub>z,c</sub>(n) = (1 / |Ω|) Σ<sub>ω</sub> [ C<sup>ω</sup>(n − 1 units) − C<sup>ω</sup>(n units) ]</p>

The result is smoothed so that it falls as n grows, and capped below P. It is also blended with the value from historical rates according to how well calibrated and how recent the forecast is, so a weak forecast counts for less.

**Repositioning.** Using that table, a small assignment model chooses moves y<sub>a,b</sub> ∈ {0, 1}, sending idle asset a to standby point b. It maximises the value gained minus the cost of moving, with at most one destination per unit and a limit on moves per run. These are recommendations like any other, and the operator confirms each one.

### Informed fallback

The fallback serves slots from most to least severe. For each slot, it takes the eligible unit with the lowest c<sub>a,s</sub> + V<sub>z,c</sub>(n), where n is how many units of that type are currently available in the unit's zone. It uses the same constraints, costs and value table as the solver, and it also starts the solver with a valid answer.

### Two small examples

These numbers are illustrative.

**Competing incidents.** Incident A is severe (weight 3) and incident B is moderate (weight 1).

| Travel time | Incident A | Incident B |
| --- | --- | --- |
| Engine 1 | 4 min | 5 min |
| Engine 2 | 6 min | 20 min |

| Approach | Result | Arrival at A | Arrival at B | Weighted cost |
| --- | --- | --- | --- | --- |
| Closest unit, most severe first | Engine 1 to A, engine 2 to B | 4 min | 20 min | 3 × 4 + 20 = 32 |
| Model, lateness ignored | Engine 2 to A, engine 1 to B | 6 min | 5 min | 3 × 6 + 5 = 23 |

The model delays the severe incident by 2 min to reach the other 15 min sooner. This is a judgement, which is why the weights need validation and the operator sees the trade-off.

**Using a forecast.** One incident of weight 1. Engine 1 is 4 min away and is the last engine in its zone. Engine 2 is 9 min away, in a zone with three engines, where its value is 1.

| Forecast for engine 1's zone | Value of engine 1 | Cost of engine 1 | Cost of engine 2 | Recommendation |
| --- | --- | --- | --- | --- |
| Calm | 2 | 4 + 2 = 6 | 9 + 1 = 10 | Engine 1 |
| Several fires likely | 12 | 4 + 12 = 16 | 9 + 1 = 10 | Engine 2, if within the delay limit |

The same incident gets a different recommendation because the forecast changed what the choice costs elsewhere. An uninformed rule cannot make this distinction.

## Approaches compared

### Choosing units now

| Approach | Handles competing incidents | Handles all the constraints | Solution quality | Explainable and repeatable |
| --- | --- | --- | --- | --- |
| A. Closest available unit | No | Eligibility only | No guarantee | Very good |
| B. Greedy with informed costs | Partly | Most, by construction | No guarantee | Very good |
| C. Linear assignment | Yes | No counts or minimums | Optimal without side constraints | Good |
| D. Assignment model in CP-SAT | Yes | Yes | Optimal or feasible, reported by the solver | Good |
| E. Vehicle routing solver | Yes | Models tours we do not need | Heuristic | Fair |
| F. Metaheuristics | Yes | Yes | No guarantee | Weak |

**A. Closest available unit.** The simplest rule, and regulation requires it in some places: [Schmid][schmid]{ .ad-cite } notes this for Austria. It looks at one incident at a time and is blind to the future, so it is only useful as a benchmark.

**B. Greedy with informed costs.** It is instant and cannot fail, and with the value table it does take the future into account. It still cannot see conflicts between slots, as the first example shows, and it has no way to report how far it is from the best answer.

**C. Linear assignment.** The Jonker-Volgenant method, [available in SciPy][scipy]{ .ad-cite }, solves the core exactly and quickly. It has no place for side constraints, including the value of what is left behind in each zone, which is now central to the model.

**D. Assignment model in CP-SAT.** It expresses the whole model directly, and new rules can be added without changing method. When stopped by a [time limit][cpsat-limit]{ .ad-cite }, it can still return a solution, with [a status][cpsat]{ .ad-cite } saying whether it is proven optimal or only feasible. Its costs are a heavier dependency and less predictable solve times than C.

**E. Vehicle routing solver.** Tools such as [VROOM][vroom]{ .ad-cite } are built to order several stops per vehicle. Our journeys have a fixed pattern, so that power adds cost and no benefit.

**F. Metaheuristics.** Genetic algorithms, tabu search and similar methods can handle any constraint, but they need tuning, offer no proof of quality and are harder to reproduce and justify.

### Taking the future into account

The [review by Bélanger, Ruiz and Soriano][belanger]{ .ad-cite } treats location, relocation and dispatching as linked decisions under uncertainty, and that is the choice here.

| Approach | Uses forecasts | Captures many incidents at once | Fits a decision in seconds | Needs dispatch history | Explainable |
| --- | --- | --- | --- | --- | --- |
| 1. Fixed reserve per zone | No | No | Yes | No | Very good |
| 2. Expected coverage formula | Rates only | No | Yes | No | Good |
| 3. Scenarios inside the solver | Yes | Yes | Unlikely at our scale | No | Fair |
| 4. Value table from simulated scenarios | Yes | Yes | Yes, computed in advance | No | Good |
| 5. Learned policy (dynamic programming or reinforcement learning) | Yes | Yes | Yes, once trained | Yes | Weak |

**1. Fixed reserve.** This was the first draft of this model. It is simple, but it holds the same units on a calm day and on the worst day of the year, so it is not informed by anything. It stays only as the agency minimum.

**2. Expected coverage.** [Daskin's model][daskin]{ .ad-cite } uses a system-wide probability that a unit is busy to value extra units in an area. It is cheap and has a clear formula, but it does not capture the wildfire days when many incidents arrive together.

**3. Scenarios inside the solver.** The most exact form: one solve covers the current choice and its consequences in every scenario. Each scenario copies part of the model, so it is unlikely to fit a decision of a few seconds at the NFR-PERF-2 scale.

**4. Value table from simulated scenarios.** It keeps most of the benefit of 3 by doing the slow work in advance. Computing answers ahead of the decision has precedent: [Gendreau, Laporte and Semet][gendreau]{ .ad-cite } precompute redeployment scenarios for real-time ambulance relocation. It values each unit type and zone separately, so it can miss effects between neighbouring zones.

**5. Learned policy.** Research shows the gains can be real, and also that they have a price. In a simulated Dutch region, [Jagtenberg et al.][jagtenberg]{ .ad-cite } reduced late arrivals by 18% against the closest idle unit, but average response time rose by 37%, and the authors do not claim that their heuristic is preferable in practice. On Vienna data, [Schmid][schmid]{ .ad-cite } reported average response time falling from 4.60 to 4.01 min. These methods need detailed dispatch history, which the project does not have, and they are the hardest to justify to an operator. The simulator built for approach 4 could train one later if real data appears.

### Routing

| Option | Runs offline | Travel time matrix | Avoids areas at request time | License |
| --- | --- | --- | --- | --- |
| [Valhalla][valhalla]{ .ad-cite } | Yes | Yes | [Yes, on routes][valhalla-route]{ .ad-cite }; [not documented for the matrix][valhalla-matrix]{ .ad-cite } | MIT |
| [OSRM][osrm]{ .ad-cite } | Yes | Yes, very fast | No. Closures need a [data update and reload][osrm-traffic]{ .ad-cite } | BSD-2-Clause |
| [GraphHopper][graphhopper]{ .ad-cite } | Yes | The Matrix API is a commercial product | Not assessed | Apache-2.0 |
| [pgRouting][pgrouting]{ .ad-cite } | Yes | Yes, inside the database | Yes, through the query | GPL-2.0 |
| HERE cloud API | No | Not assessed | Not assessed | Proprietary. Not the chosen direction in [Data source licenses](../ms3-construction/data-source-licenses.md) |

The deciding factor is safety during a crisis. A route that crosses another active fire is worse than a slower one, and the areas to avoid change from minute to minute. Valhalla accepts them with each route request, while OSRM has to process a data update and reload.

pgRouting would add no new service, but it would put heavy route calculations in the database that stores the operational records. GraphHopper's open-source engine does not include the matrix we would rely on.

## Decision

We will implement **approach D for dispatch, approach 4 for the future value, and Valhalla for routing**, with approach B as the fallback. Approach A and an uninformed version of B are kept as evaluation baselines.

- **It is informed.** Forecasts change recommendations through a single, visible number, and that also holds for the fallback.
- **It fits the problem.** Journeys follow a fixed pattern, so assignment is the right shape. The two loops separate what must be fast from what must look ahead.
- **It widens prediction.** Every model reports the same outputs, so adding a cause means adding a model, without changing the engine or the method.
- **It can justify itself.** For example: "Engine 2 arrives in 9 min. The closer engine 1 is the last one in its zone, where more fires are forecast by 18:00." This meets the justification in FR-REC-1 and supports the [human oversight and logging](../ms3-construction/gdpr-compliance.md) expected of a high-risk system under the AI Act.
- **It limits the harm of a bad forecast.** Confirmed demand comes first, the delay limit caps any extra wait, and weak forecasts count for less.
- **It works for any agency.** Each agency runs its own instance, with its own rules, on the same engine. The general models arrive pre-trained and are refined locally, and a specialist plugin can add to them without changing the core.
- **It works offline.** Solver, simulator, routing and road data all run on-premises (NFR-AVL-3).

The trade-offs accepted are a larger system than a single solver, a value table that approximates effects between zones, models that can differ from one agency to another after local refinement, and solve times that vary. An agency that must send the closest unit can set a delay limit of zero, which reduces the benefit for that agency.

### How a recommendation is produced

**Fast loop**, on a new validated incident, a changed status, an operator decision or a short periodic refresh:

1. Read the snapshot and compute demand, anticipated slots and surplus units.
2. Keep the nearest eligible assets for each slot, by straight-line distance.
3. Ask Valhalla for travel times between them, then apply the correction.
4. Build the costs using the latest value table, and compute the fallback result.
5. Run CP-SAT under its time limit, starting from the fallback result.
6. Request the full route for each chosen pair, avoiding the affected areas. If its time differs clearly from the matrix or no route exists, update the cost and solve once more.
7. Store the recommendation with its items, justification, route and arrival estimate, and show it to the operator.

**Slow loop**, every few minutes and on a new forecast:

1. Draw scenarios from the predictive engine, or from historical rates if it is unavailable.
2. Simulate them with the fallback policy to build the value table.
3. Publish the table with its forecast version and generation time.
4. Propose repositioning moves when their gain justifies them.

### When something fails

| Situation | Behaviour |
| --- | --- |
| The solver reaches its time limit | The best solution so far is used and marked as not proven optimal |
| The solver fails | The informed fallback is used and marked as such |
| The forecast is missing or out of date | The table falls back to historical rates, and then to agency minimums, and the recommendation says which basis it used |
| The slow loop stops | The last table is used until it expires, and the failure is shown |
| The routing service fails, or no route exists | Straight-line estimates are used, marked as estimates, and the reason is shown (UC-13) |
| An external forecast source fails | The average uses the remaining sources and shows which were used |
| An agency's rules have not been validated | Recommendations are marked as using unvalidated rules |
| Another agency's information is out of date or has not arrived | Past the age limit it no longer reduces demand, and the recommendation warns that the same need could be covered twice |
| A sent event is not delivered | It stays queued, the sender sees that it was not delivered, and it can be exported as a signed file |
| A plugin is missing, slow or failing | The engine continues with core data and says that the plugin's input was not applied. Its cause falls back to historical rates |
| The whole engine fails | The failure is shown and the operator continues manually (NFR-AVL-2, UC-06) |
| Not enough units | Unfilled slots are shown as unmet demand |
| A unit changes state before the decision | The recommendation is checked again when accepted, and replaced if no longer valid |

### Keeping it fast

Without a shortlist, the worst case in NFR-PERF-2 means 1 250 000 asset and incident pairs. With 20 candidates per slot and, for example, 3 slots per incident, dispatch has at most 30 000 variables, plus up to 2500 for the unit counts. A real run would usually have far fewer, because many incidents already have their units. The solver then proves optimality only within the shortlist, and a straight-line shortlist can miss a closer unit by road, which the evaluation must measure.

The value table is computed only for counts close to the current ones, which keeps the number of simulations manageable.

Recommendations also need to be stable, because an operator cannot review a suggestion that changes every few seconds. A pending recommendation is replaced only if the situation changed or the new one improves the cost by more than a set margin.

## Conditions on this decision

The implementation starts with a short technical check. These targets are proposals, and if one fails the listed response applies.

| Check | Target | If it fails |
| --- | --- | --- |
| Dispatch solve time at NFR-PERF-2 scale on control room hardware | Under 2 s, 95% of runs | Reduce the shortlist, then use the informed fallback for the largest cases |
| Time from trigger to recommendation | Under 5 s, 95% of runs | Same as above, and review the route confirmation step |
| Slow loop time | Under 60 s, 95% of runs | Fewer scenarios, or coarser zones such as districts |
| Stability of the value table | Same recommendation with a different random seed in at least 95% of test cases | Increase the number of scenarios |
| [`exclude_polygons`][valhalla-route]{ .ad-cite } on routes, given [reports of it being ignored][valhalla-4659]{ .ad-cite } in some versions | Routes never cross an avoided area in our tests, including large areas | Use OSRM and apply closures through data updates |
| Whether the matrix respects avoided areas | Known and documented | Keep the route confirmation step for every chosen pair |
| Repeatable results: same input, same output | Identical with one solver worker and a fixed seed, using [deterministic model building][cpsat-determinism]{ .ad-cite } | Store the full input and the result, so a decision can still be audited |
| Shortlist quality | Same result as the full candidate set in at least 95% of test scenarios | Increase the shortlist or use road-based shortlisting |

### Evaluation plan

Each policy runs per agency in the same simulator, on synthetic incidents and fleets with light, major and saturated demand, and with forecasts of varying quality.

| Policy | What it tells us |
| --- | --- |
| Closest available unit | The benchmark most people expect |
| Greedy, no forecast | The value of ordering by severity |
| CP-SAT, no forecast | The value of solving conflicts between incidents |
| Greedy, with forecast | The value of forecasts without the solver |
| CP-SAT, with forecast | The chosen approach |
| CP-SAT, with perfect knowledge of the future | The most that better forecasts could add |

| Measure | What it shows |
| --- | --- |
| Unmet demand, weighted by severity | Whether more needs are served |
| First-unit arrival, average and 95th percentile | Speed of response |
| Share of arrivals after the target | Reliability |
| Worst-served incident | Whether lower-severity incidents are being sacrificed |
| Units held back or moved for demand that never came | The cost of a wrong forecast |
| Decision regret against perfect knowledge | Whether a better forecast is really a better decision |
| Solve time and share of proven optimal results | Whether it is fit for live use |

Each capability stays only if it improves on the simpler policy without an unacceptable loss elsewhere. The [37% rise in average response time][jagtenberg]{ .ad-cite } in the study above is the kind of cost to look for. Results from synthetic data cannot be presented as real operational performance.

The same simulator can serve the scenarios in US-12 and US-13 (FR-PRD-2, FR-PRD-3), and it never touches live data.

## Impact on requirements and data model

These changes are proposed and have not been applied yet.

| Item | Proposed change | Why |
| --- | --- | --- |
| FR-REC-1 | Extend to reassign, reposition and anticipate, not only assign and release | The model recommends all of them |
| New requirement | Each recommendation shows the basis of its forecast, its version and its confidence | Operators must be able to weigh a forecast |
| New requirement | Every task is linked to an event. Events and task updates are sent manually by an operator to agencies with an agreement, and an agency can join an event it received without having a task | The agreed rule for sharing between agencies |
| New requirement | Recommendation latency, with the targets above once confirmed | No requirement covers it today |
| Prediction | Add demand, escalation, duration and combined external forecast types, with uncertainty, zone, cause and the model or sources that produced it | Today it covers progression and risk areas, as output of the AI engine only |
| Asset type | Agree the actual values, and add travel mode and speed per type | Profiles and estimates depend on them |
| Incident type and severity | Agree the actual values | Profiles depend on them |
| Demand profile (new) | Slots per agency, incident type and severity, with accepted unit types and targets | Demand is not modelled today |
| Value table (new) | Value per zone, type and count, with forecast version and generation time | Each decision must be reproducible |
| Plugin contract (new) | Exclusions, added costs, added slots, item details, specialist forecasts and new data sources, with the plugin and reason recorded | Plugins can refine recommendations and bring in data while the core never references them |
| Zone minimum (new) | Minimum per agency, zone and unit type | Constraint S1 |
| Agency model settings (new, versioned) | Weights, limits, rules and shortlist size, per agency | Each decision must be reproducible |
| Event (new) | Identifier shared between instances, linked to each agency's incident, with who sent it, who received it and who joined | Sharing works per event, and joining does not require a task |
| Partner agency (new) | Agencies with an agreement, with their key and the agreement reference | Only these can exchange events |
| Exchange log (new) | Each send, delivery and acceptance | Accountability for every exchange |
| Assignment, Order | Require a link to an event | Operators must link every task, and an accepted recommendation carries the link |
| Recommendation | Add a "superseded" status, solver result, method used and settings version | Items are immutable, so replaced recommendations must stay in the log (US-8) |
| Recommendation Item | Add reassign and reposition actions, the slot or destination, whether it is anticipated, whether the time was routed or estimated, and any plugin details | The operator must see what is proposed and how reliable it is |

## Risks and limits

- **Forecast errors.** A wrong forecast can hold a unit back or move it for nothing. The priority of confirmed demand, the delay limit, the blending with historical rates and the operator's decision all limit this, but they do not remove it.
- **Coordination between agencies.** Each model recommends only its own agency's units, and it knows about other agencies only through what their operators have sent. During a busy incident manual updates may lag behind reality, and competing demand on other events stays invisible. Operators remain responsible for that coordination.
- **Sharing between instances.** The mailbox service, the keys and the agreements are a proposal and have not been built. The mailbox still sees which instances exchange messages and when. All of this must be covered by the threat model, which assumes today that instances are independent. Sending does not replace the need for a legal basis, to be covered in the [GDPR compliance analysis](../ms3-construction/gdpr-compliance.md).
- **Local refinement.** Instances with little data gain little from refinement, and models can behave differently from one instance to another. Specialist models may have to be pre-trained on synthetic data, because the restricted data is not available for training before deployment.
- **Equal trust in sources.** Averaging assumes that all forecast sources are equally accurate. Sources can also share the same underlying weather models, so agreement between them is not always independent confirmation.
- **Biased history.** Past dispatches reflect past decisions and shortages, and the history available to the project depends on which connectors exist. Forecasts for incident types with little data will start weak.
- **Simplifications without plugins.** The core ignores traffic, crew limits, fuel and patient transport, and treats aircraft like any other unit with a straight-line estimate. Recommendations can therefore suggest a unit that cannot really do the job, and the operator is responsible for catching that. The recommendation must make clear what was not considered.
- **Assumed parameters.** Weights, profiles, delay limits and minimums need practitioner review before results mean anything operationally.
- **Default travel times.** Valhalla's [documented costing options][valhalla-route]{ .ad-cite } include no emergency vehicle profile, so arrival estimates need calibration and are shown as estimates.
- **Local knowledge.** OpenStreetMap can be incomplete on rural and forest roads, and a closed road may not be known at all. This is one reason the operator decides.
- **Fairness.** Severity weights and future value can leave smaller incidents or quieter zones waiting, so the worst-served incident is measured explicitly.
- **Specialist data.** Offence and health data stay in the plugin's own database, and the core adds no new personal data. Forecasts built on that data, even when aggregated, need their own assessment in the [GDPR compliance analysis](../ms3-construction/gdpr-compliance.md), as does any plugin that brings crew or patient data or video.
- **Regulation.** Dispatch recommendations are expected to be high-risk under the AI Act (see the [same analysis](../ms3-construction/gdpr-compliance.md)). OpenStreetMap data requires attribution under the ODbL (see [Data source licenses](../ms3-construction/data-source-licenses.md)).

## Sources

The online documentation and articles were consulted on 4 November 2026. For the research articles, the abstracts were read.

- Bélanger, Ruiz and Soriano, [Recent optimization models and trends in location, relocation, and dispatching of emergency medical vehicles][belanger]{ .ad-cite }, European Journal of Operational Research 272(1), 2019.
- Daskin, [A maximum expected covering location model: formulation, properties and heuristic solution][daskin]{ .ad-cite }, Transportation Science 17(1), 1983.
- Elmachtoub and Grigas, [Smart "predict, then optimize"][spo]{ .ad-cite }, Management Science 68(1), 2022.
- Gendreau, Laporte and Semet, [A dynamic model and parallel tabu search heuristic for real-time ambulance relocation][gendreau]{ .ad-cite }, Parallel Computing 27(12), 2001.
- Jagtenberg, Bhulai and van der Mei, [Dynamic ambulance dispatching: is the closest-idle policy always optimal?][jagtenberg]{ .ad-cite }, Health Care Management Science 20(4), 2017.
- Kleywegt, Shapiro and Homem-de-Mello, [The sample average approximation method for stochastic discrete optimization][saa]{ .ad-cite }, SIAM Journal on Optimization 12(2), 2002.
- Schmid, [Solving the dynamic ambulance relocation and dispatching problem using approximate dynamic programming][schmid]{ .ad-cite }, European Journal of Operational Research 219(3), 2012.
- Crouse, On implementing 2D rectangular assignment algorithms, IEEE Transactions on Aerospace and Electronic Systems 52(4), 2016, as cited in the [SciPy documentation][scipy]{ .ad-cite }.
- Google OR-Tools: [CP-SAT solver][cpsat]{ .ad-cite }, [solver parameters and time limits][cpsat-limit]{ .ad-cite }.
- Valhalla: [project][valhalla]{ .ad-cite }, [route API][valhalla-route]{ .ad-cite }, [matrix API][valhalla-matrix]{ .ad-cite }.
- OSRM: [project][osrm]{ .ad-cite }, [traffic updates][osrm-traffic]{ .ad-cite }.
- [GraphHopper][graphhopper]{ .ad-cite }, [pgRouting][pgrouting]{ .ad-cite }, [VROOM][vroom]{ .ad-cite }.

[belanger]: https://econpapers.repec.org/RePEc:eee:ejores:v:272:y:2019:i:1:p:1-23 "Bélanger, Ruiz and Soriano, 2019"
[daskin]: https://econpapers.repec.org/RePEc:inm:ortrsc:v:17:y:1983:i:1:p:48-70 "Daskin, 1983"
[spo]: https://arxiv.org/pdf/1710.08005 "Elmachtoub and Grigas, 2022"
[gendreau]: https://www.bohrium.com/paper-details/a-dynamic-model-and-parallel-tabu-search-heuristic-for-real-time-ambulance-relocation/813117794705997825-2746 "Gendreau, Laporte and Semet, 2001"
[jagtenberg]: https://ideas.repec.org/a/kap/hcarem/v20y2017i4d10.1007_s10729-016-9368-0.html "Jagtenberg, Bhulai and van der Mei, 2017"
[saa]: https://edoc.hu-berlin.de/18452/8871 "Kleywegt, Shapiro and Homem-de-Mello, 2002"
[schmid]: https://econpapers.repec.org/RePEc:eee:ejores:v:219:y:2012:i:3:p:611-621 "Schmid, 2012"
[scipy]: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html "SciPy linear_sum_assignment"
[cpsat]: https://developers.google.com/optimization/cp/cp_solver "OR-Tools CP-SAT solver"
[cpsat-limit]: https://github.com/google/or-tools/blob/stable/ortools/sat/docs/solver.md "CP-SAT solver parameters"
[cpsat-determinism]: https://groups.google.com/g/or-tools-discuss/c/ZGj5vhhZX48 "OR-Tools discussion on deterministic runs"
[vroom]: https://github.com/VROOM-Project/vroom "VROOM"
[valhalla]: https://github.com/valhalla/valhalla "Valhalla"
[valhalla-route]: https://valhalla.github.io/valhalla/api/route/api-reference/ "Valhalla route API"
[valhalla-matrix]: https://valhalla.github.io/valhalla/api/matrix/ "Valhalla matrix API"
[valhalla-4659]: https://github.com/valhalla/valhalla/issues/4659 "Valhalla issue 4659"
[osrm]: https://github.com/Project-OSRM/osrm-backend "OSRM"
[osrm-traffic]: https://github.com/Project-OSRM/osrm-backend/wiki/Traffic "OSRM traffic updates"
[graphhopper]: https://github.com/graphhopper/graphhopper "GraphHopper"
[pgrouting]: https://access.crunchydata.com/documentation/pgrouting/ "pgRouting manual"
