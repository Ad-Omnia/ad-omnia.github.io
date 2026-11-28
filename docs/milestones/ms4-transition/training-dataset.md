---
title: Training dataset
date: 2026-11-14
order: 2
description: How the training datasets for the predictive models are built from open data, cleaned, completed with mock data and limited
---

# Training dataset

<p class="ad-lede">The predictive models learn from the history of incidents and weather. This page explains where that history comes from, what is real and what is mock, how it is cleaned and turned into training datasets, and what the data cannot tell us.</p>

## Summary

- **Real data first, mock only for what no dataset has.** Rural fires (forest fires and agricultural fires, as separate types), urban fires (with the vehicles and people sent), floods with victims or damage, the municipality boundaries, the weather and the population are real, from open datasets. The occurrences and the resources sent that the Fogos.pt connector plugin collects are real too. Road accidents, medical emergencies and most floods, the fleet, escalation and travel times have no open event-level history, so only those are mock. Every row says which it is (`data_origin`).
- **A forecast is never made from mock data.** Mock rows show how a method behaves and are evaluated, but the AI service serves no forecast from them: a type whose history is mock (medical emergencies, road accidents, floods for the occurrence risk) is answered "not ready", and an incident forecast uses the real incidents of its type only.
- **Not only fires.** The platform covers emergencies in general. The datasets and models are built per incident type from whatever types the data holds, so a new type needs data, not new code. Fires happen to be where open data exists.
- **Several datasets, one per prediction.** The recommendation engine needs [six predictions](resource-allocation.md#predictions): arrivals, joint scenarios, escalation, on-scene duration, units needed and travel-time correction. The build writes one table for each, next to the original fire-risk panel (one row per municipality and day).
- **Rebuilt by one script.** `ai_service/dataset` in the private backend repository rebuilds everything from a saved snapshot. Every cleaning step is documented there, with how many rows it changed.
- **Mock is never presented as real.** Mock rows are labelled, seeded (the same snapshot gives the same mock rows), never replace a real record, and are dropped for a component as soon as real records exist. Results on mock rows describe how a model behaves, not real operational performance.

## Where the data comes from

| Data | Source | Real or mock | Reaches the AI service through |
| --- | --- | --- | --- |
| Rural fires | ICNF record of every rural fire since 2001. Its type (`TIPO`) separates forest fires (`forest_fire`) from agricultural fires and burns (`fire`), as the platform types them live | Real | Snapshot (see below) |
| Urban fires 2013 to 2022, with duration, severity, vehicles and people sent | ANEPC archive, published in [Scientific Data](https://www.nature.com/articles/s41597-023-02476-6) (CC0) | Real | Snapshot |
| Municipalities | CAOP 2025, DGT | Real | `zone`, `zone_boundary` |
| Daily weather | Open-Meteo, ERA5 reanalysis | Real | `observation` |
| Resident population per municipality | INE Census 2021 | Real, used only to place the mock | Context file beside the snapshot |
| Vehicles and people sent to rural fires | Fogos.pt history from 2018, under the project's API key (see Licenses below) | Real | Global database |
| Floods with victims or damage, 2013 to 2019 | [DISASTER database](https://doi.org/10.5281/zenodo.7117037), University of Lisbon (CC BY 4.0) | Real, 39 floods | Global database |
| Occurrences of every type and the resources sent to them (people, vehicles, aircraft), since November 2026 | Fogos.pt connector plugin | Real, 491 occurrences and 1,012 resource reports | Global database |
| Road accidents, medical emergencies, most floods | No open event-level history | Mock, in proportion to the population, the weather and the season | |
| Fleet, assignments, travel times, escalation | No open dataset | Mock | |

The historical datasets, their licenses and the attribution each requires are in [Data source licenses](../ms3-construction/data-source-licenses.md#13-historical-data-for-training).

**How the open datasets get in.** The platform's route is: connector plugins fill the global database, the CoreAPI repositories read it, and the AI Client sends the rows to the AI service, which never reads a database. The plugins for these historical datasets do not exist yet, so for the proof of concept two scripts stand in:

- `tools/load_global_db.py` writes the open datasets, and the mock layer, straight into the global database, with the table and column names of the schema. The mock records belong to their own source, "Ad Omnia mock data", and are marked in the record, so they are never mistaken for real ones. It also stores the zone risk ratings in `risk_rating`, which the AI service computes.
- `tools/send_snapshot_from_db.py` then takes the snapshot from the database through the repositories and the AI Client, which is the route the platform will use. `tools/open_data_snapshot.py` does the same without a database, sending the open datasets to the AI service directly.

- `tools/extend_global_db.py` completes a database loaded this way (or restored from the shared dump): the ICNF types of the rural fires, the occurrences and resource reports a stack's Fogos.pt plugin has collected (read from that stack's database, never from the API), the DISASTER floods and the latest days of weather. Every step can be run again and changes nothing the second time.

The Open-Meteo connector plugin (`ingestion_worker`) fills the daily weather through the normal route.

Only incidents reported by external sources are used. Incidents created by operators are left out, because they can repeat an incident that a source also reports.

## How it is built

1. A snapshot of the tables is saved. A saved snapshot rebuilds exactly the same dataset later.
2. Clean the incidents and the weather (see below).
3. Count incidents and fires per municipality and day, and add the activity of the previous day, 7 days and 30 days. These only use past days, so the model never sees the day it is predicting.
4. Add the calendar and the weather of the weather point closest to each municipality, with the fire danger indices computed from it (below).
5. Build the tables for the other predictions, completing what no dataset has with mock rows.
6. Run a short exploratory analysis.

| Table | One row per | Used for |
| --- | --- | --- |
| `training_panel` | Municipality and day | Fire risk. Real rows only |
| `incident_outcomes` | Incident | On-scene duration, escalation, units needed, with the weather of its place and day |
| `arrivals_panel` | Municipality, day and incident type | Arrivals by type |
| `joint_daily` | Day | Dependence between municipalities for joint scenarios |
| `demand_profiles` | Incident type and severity | Baseline for units needed, duration and escalation |
| `fleet`, `travel_times` | Unit, or unit type, road class and hour | Recommendations and arrival estimates. Mock |

## Build on real data

Run on 28 November 2026, for 1 January 2013 to 28 November 2026, through the platform's own route: the 15 November database completed by `tools/extend_global_db.py`, read through the repositories and the AI Client, and built and trained by an AI service started for it (never by the one serving the platform).

| Measure | Value |
| --- | --- |
| Forest fires after cleaning (ICNF, and Fogos.pt on the days the ICNF does not cover) | 135,621 |
| Agricultural fires and burns after cleaning | 36,351 |
| Urban fires after cleaning | 72,109, up to 31 December 2022 (where the archive ends), and the plugin's since November 2026 |
| Real floods | 283 (39 from the DISASTER database, 244 from the plugin) |
| Real incidents with the resources sent reported | 115,045 (71,747 urban fires, 34,142 forest fires, 8,762 agricultural fires, 394 of other types). Aircraft were sent to 634 of them |
| Municipalities (mainland) | 278 |
| Days | 5,081 |
| Fire-risk rows (municipality and day) | 1,412,518 |
| Incidents in the dataset | 1,202,470 (244,575 real, 957,895 mock) |
| Arrivals rows (municipality, day and type) | 8,143,454 |

**How the models are judged.** The days are split in three, in time order and never at random: a model learns from the first 60% of the days, the next 20% only decide when training stops, and the last 20% (the test) give the numbers below. Neither the model nor the choice of when to stop saw the test days. Each model is scored next to a simple baseline on the same test days. The baseline uses no weather: for the risk of an incident it is the share of days with one in that municipality and month, smoothed towards the national share; for arrivals, the rate of the municipality, type and month; for duration and units, the median or mean of the incident type and severity; for burnt area, the median of the month; for a large fire, the share of large fires in that municipality and month. It is fitted on every day before the test, so it has the most recent data a baseline could have.

Each prediction has one metric: AUC for the risks, because their use is to rank municipalities and days (higher is better); Poisson deviance for counts and mean error for durations and areas (lower is better). A model is called better than its baseline only when the gap passes 0.01 of AUC or 2% of an error. One command trains and evaluates everything again: `python -m dataset.model --dataset <snapshot>/dataset`.

The baseline and these metrics are the team's proposal and are still to be agreed with the advisors.

**Results on the test days** (8 February 2024 to 10 November 2026 for the occurrence risks; urban fires: 6 January 2021 to 31 December 2022, the last years of their archive). The occurrence risks learn up to 10 November 2026 (`--occurrence-until`), where the mock layer ends: past that day the mock types would look like a sudden drop of incidents. The tables of single fires (burnt area, large fire) only have days with a fire, so their test starts on 23 December 2023.

| Prediction | Real or mock | Metric | Model | Baseline | Against the baseline | Quarters ahead |
| --- | --- | --- | --- | --- | --- | --- |
| Risk of a forest fire, by municipality and day | Real | AUC | 0.867 | 0.801 | Better | 12 of 12 |
| Risk of an agricultural fire | Real | AUC | 0.845 | 0.794 | Better | 12 of 12 |
| Risk of an urban fire | Real | AUC | 0.800 | 0.794 | No clear difference | 8 of 8 |
| Arrivals, real incident types | Real | Poisson deviance | 0.174 | 0.243 | Better | |
| On-scene duration, real incidents | Real | Mean error, hours | 1.29 | 1.32 | Better, by little | |
| Burnt area of a rural fire | Real | Mean error, hectares | 20.02 | 20.04 | No clear difference | 13 of 13 |
| A rural fire burns 10 hectares or more | Real | AUC | 0.799 | 0.726 | Better | 13 of 13 |
| Units needed, real incidents | Real | Poisson deviance | 0.767 | 0.759 | No clear difference | |
| People needed, 90th percentile (the number to plan for) | Real | Pinball loss | 1.094 | 1.139 | Better | |
| Ground vehicles needed, median and 90th percentile | Real | Pinball loss | 0.501 / 0.353 | 0.512 / 0.363 | Better | |
| An aircraft is sent | Real | AUC | 0.541 | 0.547 | No clear difference | |
| Risk of floods, road accidents, medical emergencies, escalation | Mock | | Shows how the method behaves only. Never served | | | |

What the numbers say:

- **Forest and agricultural fire risk and arrivals beat the baseline**, in every quarter of the test. The forest fire model is also better calibrated (Brier score 0.038 against 0.043). Agricultural fires, a type of their own since this build, behave like forest fires: weather and recent activity carry them.
- **Urban fire risk is no better than the baseline.** Without weather-driven causes, urban fires are close to a constant rate by month, which is what the baseline already is.
- **The exact burnt area is not predictable with these data, but whether a fire becomes large is.** Predicting hectares ties with the baseline; "will this fire burn 10 hectares or more?" gives a model clearly ahead, in every quarter (the incident forecasts of the [Prediction API](prediction-api.md) use the ICNF definition of a large fire, 100 hectares).
- **The resources an incident needs** (people, ground vehicles, aircraft) are learned from 66,215 real reports of rural and urban fires. People and vehicles beat the median of the type and severity, the plan-for number most of all. Aircraft do not: they went to 0.55% of the incidents of the test days, and nothing known when an incident starts says which ones. Floods, road accidents and the other types the plugin reports have too few reports for the model: the forecast gives what was sent to their real incidents, and says so.
- **Units needed** in all ties with the baseline now that the real rows include the urban fires.
- The road accident, flood and medical figures are not real results, and those models are never served.

## What the documents ask for, and what the datasets hold

Checked against the requirements, the data model and the [resource allocation](resource-allocation.md) page.

| What the documents ask for | Where it is in the datasets | Real or mock |
| --- | --- | --- |
| Arrivals by zone, type, severity and time window (prediction 1) | `arrivals_panel` (day, with `arrivals_sev_*` by severity), `hourly_profile` (hour and day of the week) | Fires: real. Other types: mock |
| Joint scenarios, with the dependence between zones (prediction 2) | `joint_daily` | Same |
| Escalation (prediction 3) | `incident_outcomes.escalated` | Mock only: no source records it |
| On-scene duration (prediction 4) | `incident_outcomes.duration_h` | Fires and urban fires: real |
| Units needed, and the demand profile with unit types and arrival targets (prediction 5) | `incident_outcomes.units_needed`, `demand_profiles`, `demand_slots`, and `assignment` in the database | Urban fires and part of the rural fires: real. Slots: practitioner estimates. Assignments: mock |
| Travel time correction by road class, hour and unit type (prediction 6) | `travel_times` | Mock only |
| Progression of an incident (FR-PRD-1) | `incident_outcomes.area_ha` and its model | Rural fires: real, final burnt area only |
| Occurrence risk per area, with the main contributing factors (FR-PRD-4) | `occurrence_risk` models per type, with the importance of each feature | Fires: real |
| Historical risk map by zone and period, with the underlying data (FR-HIST-2) | `risk_rating`: per zone, year, month and the whole range, with the breakdown by type and severity | Computed by the AI service |
| Fleet, agencies and standby points | `fleet`, `asset`, `agency` | Mock |
| Fire danger from the weather | `ffmc`, `dmc`, `dc`, `isi`, `bui`, `fwi`, computed for every day | Real weather |
| Historical simulations (FR-PRD-2, FR-PRD-3) | The rates, profiles and fleet above are the historical inputs. The simulation tables are never read | |

Not covered, and why:

- **Weather forecasts** for the coming days (FR-PRD-4) are not in the history: they are a live feed.
- **The road network** (routes and arrival times, FR-REC-2) is an input of the routing engine, not of these datasets.
- **Operator decisions on recommendations** (accepted, adjusted, rejected) do not exist until the engine runs.
- **Specialist data** (offence and health data) stays in its plugin by design.
- **Madeira and the Azores**, and **road accidents, medical emergencies and floods as real events**, as described below.

## Other kinds of emergency

The platform is not only for fires, so open data for other kinds was searched (15 November 2026). Only fires have open event-level history.

| Kind | What exists | Used |
| --- | --- | --- |
| Urban fires | ANEPC archive 2013 to 2022, published in Scientific Data (CC0) | Yes |
| Road accidents | ANSR publishes totals and indices by region and year, not events. Lisbon's open data portal answers automated requests with a bot check (28 November 2026) | Totals set the size of the mock. The plugin's road accidents since November 2026 are real |
| Medical emergencies | INEM publishes yearly totals, about 1.5 million occurrences in 2025, not events by municipality | Totals set the size of the mock |
| Floods and landslides | DISASTER database of the University of Lisbon, 1865 to 2020, only events with victims or damage (CC BY 4.0) | Floods from 2013 (39), since 28 November 2026. Sparse, so they complement the mock. Landslides have no platform type |
| Other ANEPC occurrences | The Scientific Data paper states there is no open history, only the daily occurrences online | No |
| Maritime rescue | Search-and-rescue regions only. Accident records are on request | No |
| Earthquakes, weather warnings, Madeira occurrences | Available through the Fogos.pt API | Candidates, not loaded yet |

The ingestion has to bring in what no open dataset gives: the agencies' own records of these kinds, through plugins or manual import. Until then they are mock, sized by the published totals.

## Fire danger indices

Fire danger is measured with the Fire Weather Index (FWI) system: fine fuel moisture, duff moisture, drought, initial spread, buildup and the Fire Weather Index itself. It is the system used in Portugal: the IPMA publishes its fire danger from it and the ICNF records its indices at the moment of every rural fire. The dataset computes the indices from the daily weather for every point and day, so they exist for days without a fire and can be computed from a forecast the same way. The calculation reproduces the published test values of the reference (Van Wagner and Pickett, 1985).

The ICNF values allowed a check on 28,854 real fires from 2019 to 2021: the ranks agree closely (correlation 0.85 to 0.96), but our values run higher than the official ones (mean Fire Weather Index 32 against 19), because the system is defined for noon readings and the dataset has the afternoon extremes. They are used as a relative measure of danger, not with the official class thresholds.

## Cleaning

| Step | What it does | Why |
| --- | --- | --- |
| Records without a start date | Removed | They cannot be placed in time |
| False alarms | Removed when the source marks them | Nothing happened, so they are not arrivals |
| Duplicates and outdated copies | Only the most recent copy of each occurrence is kept | A source can send the same occurrence again after a change |
| Dates outside the period | Removed, including future dates | Keeps the period exact |
| Resources of a fire | An ICNF fire gets the vehicles and people Fogos.pt reports for the same fire (same municipality, started within 3 hours) | The ICNF records none, and the Fogos.pt copy is dropped next |
| Same fire from two sources | Fires from other sources are dropped on days the ICNF covers | Each fire is counted once |
| Municipality | Taken from the CAOP municipality that contains the incident | The incident table has no municipality column |
| Incidents without a municipality | Removed | The dataset is built per municipality |
| Coordinates outside Portugal | Set to missing, keeping the incident | The municipality is still valid |
| Missing fire flag | Taken from the ANEPC code, where 31xx are rural fires | Not every source provides the flag |
| Local day | Each incident is assigned to its day in Portugal's time zone | Handles summer time |
| Impossible durations | Negative or over 30 days set to missing | They are record errors, not incidents |
| Resources "0" | Taken as "not reported", not "none needed" | A source that does not know sends 0 |
| Duplicate weather days | One row per point and day | The same day can be ingested twice |
| Impossible weather values | Set to missing | Guards against corrupted values |
| Short weather gaps | Gaps of up to 2 days are filled, except wind direction | Longer gaps stay missing |

The text description of each incident is never used, because it can describe a person or an address.

## The mock layer

The mock follows its context instead of a flat random rate:

- **How many.** Yearly national counts of the order of magnitude seen in Portugal, as placeholders until ANEPC, ANSR and INEM statistics are loaded, spread over the municipalities.
- **Where.** More in populous municipalities (INE population), and fire engines and helicopters based where the real fires are most frequent.
- **Where exactly.** On a built-up place of the municipality, taken from the location of a real urban fire (a street or a building), and always inside the municipality's boundary: nothing lands in the sea or in a neighbouring municipality.
- **Predictable scenarios.** A few recurring events at one fixed place, so a model has patterns it can learn and the predictions can be checked by eye: an accident at the same junction every morning, a motorway crash every Friday night, a flood at the same riverside spot after heavy rain, a clinic emergency every weekday at noon. They are labelled with their name.
- **When.** By season, day of the week and hour of the day for each type. Floods follow the rain of the day and of the three days before. Road accidents rise with rain and on Fridays. Medical emergencies rise with heat.
- **How bad.** More units for more severe incidents. Escalation is more likely with strong wind for structure fires and with heavy rain for floods.

The incident types, severities and unit types of the mock layer are placeholders, because the team has not agreed the real values yet.

## Limitations

- **History depends on the source.** Rural fires go back to 2001 and are loaded to November 2026. Urban fires cover 2013 to 2022. The Fogos.pt history loaded here runs from January 2018 to 9 September 2024 and holds rural fires only (the download asked for wildfires only, and was stopped when the service limited the requests: the rest needs the service's agreement to a bulk download), so the vehicles and people sent are known for rural fires from 2018 only, and for 25% of them after matching.
- **What was reported, not what happened.** The data records occurrences that were reported and dispatched. Small fires that were never reported, or were recorded under another type, are missing. Urban fire coordinates are marked as not exact for about 7% of events.
- **Most of the mock cannot be validated.** Road accidents, medical emergencies, floods, the fleet, escalation and travel times have no real data here. Their models only show that the method works. Real validation needs the agencies' records.
- **No real assignments.** The open urban fire data and Fogos.pt say how many vehicles and people were sent, not which units. For rural fires before 2018 the units sent are unknown: the ICNF does not record resources.
- **Occurrences, not all emergencies.** Medical emergencies handled only by INEM and police occurrences are not in the open data, and as specialist data they stay out of this dataset anyway.
- **Fewer fires over time.** The number of fires fell by about two thirds between the 2000s and the 2020s. Prevention, land use and how small fires are recorded all changed, and the data cannot tell these apart. The build starts in 2013, so it still spans part of this fall. The activity of the previous 7 and 30 days follows the trend in part, but the period is not yet modelled as a trend of its own.
- **Most days have no fire.** In most municipalities, most days have no fire at all (91.7% of the rows). Simple accuracy will look good even for a useless model, so the models are judged by AUC against a baseline, on days they have not seen.
- **Fire danger indices run high.** They are computed from daily extremes, not noon readings, so their levels are above the official ones even though their ordering agrees (see above).
- **Weather is modelled, not measured.** The weather comes from a reanalysis grid (about 25 km), not from stations, and each municipality uses the nearest of a few dozen points. A check against 9 IPMA stations over 90 days (autumn 2026, 601 station-days) shows that it follows the real weather but is smoother: maximum temperature correlates 0.81 and is 2.0 C cooler on average, minimum humidity correlates 0.70 and is 8 points higher, daily rain agrees on 95% of the days, and wind agrees poorly (correlation 0.5 to 0.6). Hot, dry days, which matter most for fires, are therefore somewhat understated. Real station readings exist only for the last 90 days (Fogos.pt, from IPMA), so they cannot give the 2013 to 2022 history; they are for the live feed and for refining the models locally. The archive lags by about two days. For training this only leaves out the last days; for live forecasts the Open-Meteo plugin also brings a forecast feed, which fills those days and the days ahead (see the [Prediction API](prediction-api.md#how-the-coreapi-calls-it)).
- **One ring per municipality.** `zone_boundary` stores one ring per zone, so municipalities with exclaves are approximated by their largest part. Mainland only: Madeira and the Azores fall in no zone until their CAOP files are loaded.
- **Severity of rural fires is unknown.** The ICNF record gives the burnt area, not a severity at dispatch time, so rural fires have severity "unknown".
- **Exact locations are kept.** The team decided to keep incident locations exact, because the models and the weather join gain from them. An exact location with a date can identify the people involved, so the snapshot and the cleaned incidents are personal data and are stored with the same care as the database. See below.

## Privacy

The AI service applies the steps of [GDPR section 9](../ms3-construction/gdpr-compliance.md#ai) as far as the decision above allows:

| Step | Status |
| --- | --- |
| Prefer synthetic data | Mock rows fill what no dataset has |
| Generalise locations | Off by default (exact). A setting stores each incident as the centre of a 1 km cell for an agency that requires it |
| Drop free text | Always. Only the columns the models use are kept, and inside the JSON columns only the type code, the resources sent, the burnt area and the false-alarm flag |
| Destroy the raw extract | An operation deletes the raw tables and keeps the dataset and the models, and a retention in days can do it automatically. Off by default so a dataset can always be rebuilt |
| Access | Snapshot and dataset folders are readable by the service account only |

## Licenses and attribution

| Source | Condition |
| --- | --- |
| ICNF | License of the web service not published, to be confirmed. "Source: ICNF, Instituto da Conservação da Natureza e das Florestas" |
| Urban fires 2013 to 2022 | CC0. Cite the data descriptor in Scientific Data |
| CAOP 2025 | CC BY 4.0. "Carta Administrativa Oficial de Portugal (CAOP), Direção-Geral do Território" |
| INE Census 2021 | CC BY 4.0. "Source: INE, Statistics Portugal" |
| Fogos.pt | API key held by the project. The [Data source licenses](../ms3-construction/data-source-licenses.md#13-historical-data-for-training) record a paid licence for the history, whose terms are still to be confirmed; until then the [API terms](https://fogos.pt/en/api-termos) apply: non-commercial use, no redistribution, no bulk or abusive requests, and not the only source for emergency decisions (used here for training and analysis only). "Source: [Fogos.pt](https://fogos.pt)" |
| Open-Meteo | Data under CC BY 4.0, "Weather data by Open-Meteo.com". The free API is for non-commercial use only |

See [Data source licenses](../ms3-construction/data-source-licenses.md) for each source's terms.

## A trained model from the first start

A new stack does not train: training takes several GB of memory and minutes of processor, and the AI service has 3 GB and 2 processors for answering forecasts. The base dataset and the models trained on it ship in a private image, `ai-seed`, built by `tools/build_ai_seed.sh` from a trained snapshot, with the models promoted exactly as in production (only data formats, the SHA-256 of every file in `registry.json`). In `docker-compose.yml`, `ai_seed` runs once before the AI service and fills its volumes where they are empty, so the platform forecasts with trained models from its first request. A model promoted later is never replaced. The image holds exact locations, so it is kept in the private registry only.

