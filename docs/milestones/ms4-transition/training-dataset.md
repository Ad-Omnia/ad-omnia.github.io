---
title: Training dataset
date: 2026-11-14
order: 2
description: How the training datasets for the predictive models are built from open data, cleaned, completed with mock data and limited
---

# Training dataset

<p class="ad-lede">The predictive models learn from the history of incidents and weather. This page explains where that history comes from, what is real and what is mock, how it is cleaned and turned into training datasets, and what the data cannot tell us.</p>

## Summary

- **Real data first, mock only for what no dataset has.** Rural fires, urban fires (with the vehicles and people sent), the municipality boundaries, the weather and the population are real, from open datasets. Road accidents, medical emergencies, floods, the fleet, escalation and travel times have no open event-level dataset, so only those are mock. Every row says which it is (`data_origin`).
- **Not only fires.** The platform covers emergencies in general. The datasets and models are built per incident type from whatever types the data holds, so a new type needs data, not new code. Fires happen to be where open data exists.
- **Several datasets, one per prediction.** The recommendation engine needs [six predictions](resource-allocation.md#predictions): arrivals, joint scenarios, escalation, on-scene duration, units needed and travel-time correction. The build writes one table for each, next to the original fire-risk panel (one row per municipality and day).
- **Rebuilt by one script.** `ai_service/dataset` in the private backend repository rebuilds everything from a saved snapshot. Every cleaning step is documented there, with how many rows it changed.
- **Mock is never presented as real.** Mock rows are labelled, seeded (the same snapshot gives the same mock rows), never replace a real record, and are dropped for a component as soon as real records exist. Results on mock rows describe how a model behaves, not real operational performance.

## Where the data comes from

| Data | Source | Real or mock | Reaches the AI service through |
| --- | --- | --- | --- |
| Rural fires | ICNF record of every rural fire since 2001 | Real | Snapshot (see below) |
| Urban fires 2013 to 2022, with duration, severity, vehicles and people sent | ANEPC archive, published in [Scientific Data](https://www.nature.com/articles/s41597-023-02476-6) (CC0) | Real | Snapshot |
| Municipalities | CAOP 2025, DGT | Real | `zone`, `zone_boundary` |
| Daily weather | Open-Meteo, ERA5 reanalysis | Real | `observation` |
| Resident population per municipality | INE Census 2021 | Real, used only to place the mock | Context file beside the snapshot |
| Vehicles and people sent to rural fires | Fogos.pt history from 2018, under the project's API key (see Licenses below) | Real | Global database |
| Road accidents, medical emergencies, floods | No open event-level dataset | Mock, in proportion to the population, the weather and the season | |
| Fleet, assignments, travel times, escalation | No open dataset | Mock | |

The historical datasets, their licenses and the attribution each requires are in [Data source licenses](../ms3-construction/data-source-licenses.md#13-historical-data-for-training).

**How the open datasets get in.** The platform's route is: connector plugins fill the global database, the CoreAPI repositories read it, and the AI Client sends the rows to the AI service, which never reads a database. The plugins for these historical datasets do not exist yet, so for the proof of concept two scripts stand in:

- `tools/load_global_db.py` writes the open datasets, and the mock layer, straight into the global database, with the table and column names of the schema. The mock records belong to their own source, "Ad Omnia mock data", and are marked in the record, so they are never mistaken for real ones. It also stores the zone risk ratings in `risk_rating`, which the AI service computes.
- `tools/send_snapshot_from_db.py` then takes the snapshot from the database through the repositories and the AI Client, which is the route the platform will use. `tools/open_data_snapshot.py` does the same without a database, sending the open datasets to the AI service directly.

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

Run on 15 November 2026 from the open datasets above, for 1 January 2013 to 10 November 2026, through the platform's own route: the data was loaded into the global database, read through the repositories and the AI Client, and built by the AI service.

| Measure | Value |
| --- | --- |
| Rural fires after cleaning | 171,949, up to 10 November 2026 |
| Urban fires after cleaning | 72,099, up to 31 December 2022 (where the archive ends) |
| Rural fires with real vehicles and people sent (from Fogos.pt, January 2018 to 9 September 2024) | 42,831 (25%), 1.9 units on average |
| Municipalities (mainland) | 278 |
| Days | 5,062 |
| Fire-risk rows (municipality and day) | 1,407,236 |
| Rows with at least one rural fire | 8.9% in the first 80% of the days (to February 2024), 6.5% in the last 20% |
| Incidents removed because they fall in no mainland municipality | 1,658 |
| Mock incidents (floods, road accidents, medical emergencies) | 957,895, none outside a municipality |
| Incidents in the database | 1,297,295 (339,400 real, 957,895 mock) |
| Mock assignments in the database (units sent by a mock operator) | 1,365,887 |
| Risk ratings stored | 50,596 (per municipality: each year, each month and the whole period) |

**How the models are judged.** The days are split in three, in time order and never at random: a model learns from the first 60% of the days, the next 20% only decide when training stops, and the last 20% (the test) give the numbers below. Neither the model nor the choice of when to stop saw the test days. Each model is scored next to a simple baseline on the same test days. The baseline uses no weather: for the risk of an incident it is the share of days with one in that municipality and month, smoothed towards the national share; for arrivals, the rate of the municipality, type and month; for duration and units, the median or mean of the incident type and severity; for burnt area, the median of the month; for a large fire, the share of large fires in that municipality and month. It is fitted on every day before the test, so it has the most recent data a baseline could have.

Each prediction has one metric: AUC for the risks, because their use is to rank municipalities and days (higher is better); Poisson deviance for counts and mean error for durations and areas (lower is better). A model is called better than its baseline only when the gap passes 0.01 of AUC or 2% of an error. One command trains and evaluates everything again: `python -m dataset.model --dataset <snapshot>/dataset`.

The baseline and these metrics are the team's proposal and are still to be agreed with the advisors.

**Results on the test days** (rural fires and the mock types: 8 February 2024 to 10 November 2026; urban fires: 6 January 2021 to 31 December 2022, where their archive ends). The split counts the days a table has rows for: the tables of single fires (burnt area, 10 hectares or more) only have days with a fire, so their test starts on 23 December 2023, and duration and units needed on 2 February 2024. The models are not specific to fires: each incident type in the data gets its own model, and a type is added by adding data.

| Prediction | Real or mock | Metric | Model | Baseline | Against the baseline | Quarters ahead |
| --- | --- | --- | --- | --- | --- | --- |
| Risk of a rural fire, by municipality and day | Real | AUC | 0.855 | 0.788 | Better | 12 of 12 |
| Risk of an urban fire | Real | AUC | 0.800 | 0.794 | No clear difference | 8 of 8 |
| Arrivals, real incident types | Real | Poisson deviance | 0.312 | 0.402 | Better | |
| On-scene duration, real incidents | Real | Mean error, hours | 1.30 | 1.34 | Better, by little | |
| Burnt area of a rural fire | Real | Mean error, hectares | 20.02 | 20.04 | No clear difference | 13 of 13 |
| A rural fire burns 10 hectares or more | Real | AUC | 0.797 | 0.726 | Better | 13 of 13 |
| Units needed, real incidents | Real | Poisson deviance | 0.649 | 0.679 | Better, on few fires | |
| Risk of floods, road accidents, medical emergencies, escalation | Mock | | Shows how the method behaves only | | | |

What the numbers say:

- **Rural fire risk and arrivals beat the baseline**, in every quarter of the test. For rural fires the model is also better calibrated (Brier score 0.051 against 0.057).
- **Urban fire risk is ahead in every quarter, but by too little to count** (0.006 of AUC). Without weather-driven causes, urban fires are close to a constant rate by month, which is what the baseline already is.
- **The exact burnt area is not predictable with these data, but whether a fire becomes large is.** Predicting hectares ties with the baseline. Asking instead "will this fire burn 10 hectares or more?" (4.6% of the fires in the test do; this daily model uses 10 hectares, while the incident forecasts of the [Prediction API](prediction-api.md) use the ICNF definition of a large fire, 100 hectares) gives a model clearly ahead of the baseline, in every quarter. The municipality, the humidity, the hour and the fire danger indices carry it.
- **Duration improves a little** once the municipality is a feature (3% less error than the baseline on real incidents).
- **Units needed** is better on the real rows, but those are 2,750 rural fires up to September 2024, so that figure is weak.
- **Early stopping did not flatter the rural fire model**: it scores 0.848 on the days used to stop training and 0.855 on the test. An earlier version of this page reported 0.86, measured on the days that also stopped the training; the figure above replaces it.
- **More training does not help.** The arrivals model stops at its limit of 500 rounds, but letting it run to 1,727 rounds improves it by 0.4% and makes each prediction three times slower. Bigger trees, a different learning rate and rolling weather averages changed the rural fire risk by 0.003 of AUC at most. The models have taken what these features hold; more accuracy needs new information (land cover, finer weather, neighbouring municipalities), not tuning.
- **Speed.** One day of rural fire risk for all 278 municipalities takes about 5 milliseconds on one processor core.
- The road accident, flood and medical figures are not real results: the mock scenarios (below) are at fixed places, and the baseline already sees them at municipality level.

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
| Road accidents | ANSR publishes totals and indices by region and year, not events | Totals set the size of the mock |
| Medical emergencies | INEM publishes yearly totals, about 1.5 million occurrences in 2025, not events by municipality | Totals set the size of the mock |
| Floods and landslides | DISASTER database of the University of Lisbon, 1865 to 2020, only events with victims or damage | Not loaded yet. It is sparse, so it complements the mock |
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
