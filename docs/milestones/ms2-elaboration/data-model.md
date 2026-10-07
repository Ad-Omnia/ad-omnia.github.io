---
date: 2026-10-07
order: 4
description: Data model for the application
---

# Data Model

## Introduction

This catalog defines the entities of the Ad Omnia platform's data model. Each entity is described using the same structure:

- **Description:** What the entity represents.
- **Key attributes:** The attributes relevant to the domain.
- **Relationships:** The entities it connects to, and in which direction.
- **Ownership:** Whether the entity belongs to the core or to a plugin.
- **Rationale:** The user stories that require it.

## Overview

The model is split into a stable core, controlled by the platform, and extensions brought in by plugins. Connector plugins translate data from external sources into core entities; when they need their own structure, they create entities in their own space that reference the core.

There is a single dependency rule: **plugins may reference the core, but the core never references a plugin.** This way a plugin can be added, updated or removed without changing the core.

Core entities fall into four areas:

| Area | Entities | Role |
| --- | --- | --- |
| Organizational | Agency, User, Source | Who operates the platform and where data comes from |
| Geographic | Zone | Reference areas for filtering, risk analysis and simulation |
| Operational | Incident, Incident Relation, Asset, Observation, Assignment, Order, Alert | The situation on the ground and how it is managed |
| Decision support | Prediction, Recommendation, Recommendation Item, Risk Rating, Simulation | What the AI projects, suggests and simulates |
| Public communication | Public Warning | What citizens are told |
| Cross-cutting | Audit Log | Traceability of actions |

## Organizational entities

### Agency

**Description:** Emergency or security organization that owns assets.\
**Key attributes:** Name, agency type.\
**Relationships:** Owns many Assets.\
**Ownership:** Core.\
**Rationale:** US-1 and US-2 require assets to be distinguished and filtered by agency on the map.

### User

**Description:** Control room member authenticated in the private application.\
**Key attributes:** Username, role (operator, analyst).\
**Relationships:** Decides on Recommendations; generates Audit Log entries.\
**Ownership:** Core.\
**Rationale:** Operator and analyst personas. Citizens use the public application without an account, so they are not Users.

### Source

**Description:** Concrete origin of data.\
**Key attributes:** Name, type (real-time or static), plugin name and version (if applicable), trust level, enabled or not, last successful update, status (ok, outdated, unavailable), staleness threshold.\
**Relationships:** Produces Observations; originates Incidents and Assets; supports Predictions.\
**Ownership:** Core.
**Rationale:** US-1 and US-15 require showing each source's last update and flagging outdated or unavailable sources; US-2 requires filtering by source. The staleness threshold is set per source because update frequencies differ widely. The plugin name and version are enough to trace which code produced the data.

## Geographic entities

### Zone

**Description:** Geographic area (district, municipality or sub-region).\
**Key attributes:** Name, type (district, municipality, sub-region), boundary.\
**Relationships:** Contained in a parent Zone; has Risk Ratings; can be targeted by Simulations.
**Ownership:** Core.
**Rationale:** US-2 (filter by region), US-10 (search by zone), US-11 (risk per zone) and US-12 (simulate selected zones).

## Operational entities

### Incident

**Description:** Occurrence that requires a response, received from an external source or created manually by an operator.\
**Key attributes:** Type, severity, status (active, in resolution, closed), description, location or affected area, start and end, reference in the originating source, validated (by whom, when), published on the public app, last update, source-specific attributes.
**Relationships:** Originated by a Source or created by a User; aggregates Observations; linked to other Incidents through Incident Relations; has Assignments, Orders and Alerts; subject of Predictions and Recommendations; may be referenced by Public Warnings.
**Ownership:** Core. Details specific to one source live in an extensible field or in a plugin entity.
**Rationale:** The central unit of the COP (US-1). Manual creation covers occurrences reported by phone or radio (US-3). Validation and publication separate what the control room knows from what citizens see: only validated, published incidents reach the public app (US-9, US-15).

### Incident Relation

**Description:** Link between two incidents.\
**Key attributes:** Origin incident, target incident, relation type.\
**Relationships:** Links two Incidents.\
**Ownership:** Core.\
**Rationale:** US-10 requires related incidents to be shown with their relationship labeled, not as a flat list.

### Incident Source Link

**Description:** Link between an incident and one of the sources that reported it.\
**Key attributes:** Incident, source, the incident's reference in that source, first seen, last seen.\
**Relationships:** Links an Incident to a Source (resolves their many-to-many relationship).
**Ownership:** Core.
**Rationale:** The same occurrence can be reported by several sources (e.g. a wildfire on Fogos.pt and in another feed), each with its own identifier. Keeping one Incident with several links avoids duplicates on the COP (US-1) and shows where each piece of information came from (US-2, US-10). Manually created incidents have no links.

### Asset

**Description:** Resource that can be committed to an incident.\
**Key attributes:** Type, callsign, status (available, engaged, out of service), last known position, last update.
**Relationships:** Owned by an Agency; reports Observations; has Assignments; receives Orders; appears in Recommendation Items.
**Ownership:** Core.
**Rationale:** US-1 and US-2 (position and status by agency and type); US-3 (operators update status); US-7 (the recommendation engine needs available assets).

### Observation

**Description:** Single timestamped record coming from a source (an asset's position, an incident's status, a weather reading).\
**Key attributes:** Type, location, observed time, ingestion time, source-specific content.\
**Relationships:** Produced by a Source; optionally linked to an Incident and/or an Asset.\
**Ownership:** Core. It is the uniform entry point for all connectors.\
**Rationale:** Lets the analyst reconstruct how an incident evolved (US-10) and provides historical data to train the predictive AI (US-6).

### Assignment

**Description:** Actual commitment of an Asset to an Incident over a period of time.\
**Key attributes:** Start and end, assigned by, originating recommendation item (if any).\
**Relationships:** Links an Incident to an Asset (resolves their many-to-many relationship); created by a User; optionally results from a Recommendation Item.\
**Ownership:** Core.\
**Rationale:** US-3 (assign resources to an incident). It separates what was suggested from what was done, and links the two when a recommendation is accepted (US-8).

### Order

**Description:** Instruction sent to a field team about an incident.\
**Key attributes:** Content, issued at, issued by, status (acknowledged or not), acknowledged at, acknowledgment recorded by.\
**Relationships:** Belongs to an Incident; addressed to an Asset; issued by a User.\
**Ownership:** Core.\
**Rationale:** US-4. Pending orders are those with no acknowledgment; the overdue period is a configuration setting, not stored per order.

### Alert

**Description:** Notification to the control room about a new incident from an external source, or a significant change to an existing one.\
**Key attributes:** Type (new incident, severity change, status change), created at, acknowledged at, acknowledged by.\
**Relationships:** Refers to an Incident; acknowledged by a User.\
**Ownership:** Core.\
**Rationale:** US-5. Alerts are shared by the whole control room: every user sees all of them, and an alert is acknowledged once for the room, staying visible until then.

## Decision support entities

### Prediction

**Description:** Output of the predictive AI engine.\
**Key attributes:** Type (incident progression, risk area), model version, generated at, time horizon, risk score, confidence level, projected area, input data timestamp.
**Relationships:** Refers to an Incident (progression only); based on one or more Sources; may support Recommendations.
**Ownership:** Core.
**Rationale:** US-6 requires configurable horizons, risk areas not tied to an incident, the confidence of each prediction, and when and from which data it was generated.

### Recommendation

**Description:** Proposal from the tactical recommendation engine for responding to an incident, together with the operator's decision.\
**Key attributes:** Generated at, justification, status (proposed, accepted, adjusted, rejected), decided by, decided at, decision reason.\
**Relationships:** Refers to an Incident; optionally based on a Prediction; contains one or more Recommendation Items; decided by a User.\
**Ownership:** Core.\
**Rationale:** US-7 (short justification; accept, adjust or reject before applying). US-8 (log of every recommendation, the decision, who and when, with an optional reason, in chronological order). An adjusted recommendation is never edited: its items keep what the engine suggested, and what the operator actually applied is recorded in Assignments.

### Recommendation Item

**Description:** Concrete action proposed for one asset within a recommendation.\
**Key attributes:** Action (assign, release), suggested route, estimated time of arrival.\
**Relationships:** Belongs to a Recommendation; refers to an Asset; may result in an Assignment.\
**Ownership:** Core.\
**Rationale:** US-7 requires a route and arrival estimate for each suggested resource, and covers both assigning and releasing resources. Items are immutable once generated, so the log always shows what the engine originally suggested (US-8).

### Risk Rating

**Description:** Historical risk level of a zone for a time period.\
**Key attributes:** Period, risk level, incident count, breakdown by type and severity, trend, data date range, computed at.\
**Relationships:** Belongs to a Zone.\
**Ownership:** Core.\
**Rationale:** US-11 requires the data behind each rating, the date range used and when it was last refreshed. Unlike Prediction, it describes the past rather than the coming hours.

### Simulation

**Description:** Scenario run by an analyst with the predictive engine and synthetic or historical data, fully isolated from live operations.\
**Key attributes:** Name, type (scenario, capacity limit), parameters (time window, expected event type, data inputs, demand scaling), status, created by, created at, results (projected incident volume, severity distribution, resource demand, saturation point, first resource types to run out, unmet demand).\
**Relationships:** Created by a User; covers one or more Zones; may be a re-run of another Simulation.
**Ownership:** Core.\
**Rationale:** US-12 and US-13. Results are stored only here and never written to Incident, Asset or Assignment, so they cannot be mistaken for live data. The re-run link supports saving and comparing simulations (optional in US-12).

### Simulated Incident

**Description:** Single synthetic incident generated within a simulation, together with the simulated response to it.\
**Key attributes:** Type, severity, location, simulated time, assets allocated, simulated response time, whether demand was met.\
**Relationships:** Belongs to a Simulation; references Assets (simulated allocation, no effect on real Assignments).\
**Ownership:** Core.\
**Rationale:** US-13 requires unmet requests and response delays, which can only be computed by simulating incidents one by one and allocating assets to each. Individual incidents can also be drawn on a map and replayed over time, clearly marked as synthetic (US-12). They are kept in their own entity, never in Incident, to guarantee isolation from live data.

## Public communication entities

### Public Warning

**Description:** Warning issued to citizens for a geographic area.\
**Key attributes:** Message, severity, area, status (active, ended), issued at, last update, ended at, issued by.\
**Relationships:** Issued by a User; optionally related to an Incident.\
**Ownership:** Core.\
**Rationale:** US-9 (issue, update and end warnings for an area). Publishing incidents themselves is handled by Incident attributes.

## Cross-cutting entities

### Audit Log

**Description:** Immutable record of an action taken by a user in the private application.\
**Key attributes:** User, action, affected entity and its identifier, timestamp, details (e.g. previous and new values, or the filters applied to an export).\
**Relationships:** Generated by a User; points generically to any entity.\
**Ownership:** Core.
**Rationale:** US-3 (record who made each change and when) and US-14 (log who exported what, and when); also a platform security requirement.

## Plugin extensions

The examples below show the two forms of extension; each plugin's actual entities will be defined together with its connector.

### Fogos.pt Incident Detail (specialization)

**Description:** Data specific to a wildfire reported by Fogos.pt that does not make sense for other incident types.\
**Key attributes:** Ground assets, aerial assets, personnel deployed, nature of the occurrence.\
**Relationships:** Specializes an Incident (one-to-one).\
**Ownership:** Fogos.pt plugin.
**Rationale:** The operator sees the officially reported resources for each wildfire, without the core needing to know the Fogos.pt format.

### ADS-B Track Point (time series)

**Description:** Aircraft's position at a given moment, received via ADS-B.\
**Key attributes:** ICAO identifier, position, altitude, speed, observed time.\
**Relationships:** Refers to an Asset of type aircraft.\
**Ownership:** ADS-B plugin.\
**Rationale:** The operator tracks aerial assets in real time; the high volume justifies a dedicated entity rather than generic Observations.
