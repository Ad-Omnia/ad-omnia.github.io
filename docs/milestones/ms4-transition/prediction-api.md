---
title: Prediction API
date: 2026-11-17
order: 3
description: The contract between the CoreAPI and the AI service for incident progression forecasts
---

# Prediction API

<p class="ad-lede">How the CoreAPI asks the AI service how an open incident is expected to progress, and what comes back, so the COP can show each forecast with its confidence, its age and the data it was based on.</p>

## Summary

- **One call per incident.** The CoreAPI's AI Client sends the incident and the horizons it wants; the AI service answers one forecast per horizon, shaped as a Prediction of the data model.
- **The AI service reads no database and is reached only by the CoreAPI.** Everything it needs about the incident is in the request. It sits on an internal network shared only with the CoreAPI, has no internet access, and refuses every request without the service token (`AI_SERVICE_TOKEN`), except `/health`.
- **Every forecast says how sure it is and where it comes from:** a confidence level, when it was generated, the moment of the data it started from, and the history it was computed from.
- **A failure never reaches the rest of the platform.** The call has a 10 second timeout. If the AI service is down, slow or refuses, the AI Client raises `AiServiceError`, the incident is shown without a forecast, and the map, incidents and alerts are not affected.

## Request

`POST /predictions/incident-progression`

| Field | Type | Meaning |
| --- | --- | --- |
| `incident_id` | text | Id of the incident, echoed in the answer |
| `incident_type` | text | As in `incident_type.description` |
| `severity` | text, optional | As in `incident_severity.description` |
| `zone` | text, optional | Zone code of the incident |
| `latitude`, `longitude` | numbers, optional | Where the incident is, to place the projected area |
| `terrain` | numbers by name, optional | The place: `altitude_m`, `slope`, `sun_exposure_h`, `road_density`, `landcover_variety` (ICNF fields; meanings inferred from their names). Not needed: when missing they are read from the coordinates, from the places of past fires within about 2 km |
| `weather_days` | list, optional | The daily weather of the days before the fire and its own, oldest first, at the place of the incident: `day`, `temperature_max`, `relative_humidity_min`, `wind_speed_max`, `precipitation_sum`. The service derives `dry_days` and the fire weather indices from them, exactly as the training dataset does, so 150 or more days are needed for the indices (the drought code has a long memory); with fewer it uses the raw values only. The CoreAPI sends this |
| `weather` | numbers by name, optional | Weather fields sent directly, which override those derived from `weather_days`, as in the training dataset: `temperature_max`, `relative_humidity_min`, `wind_speed_max`, `precipitation_sum`, `dry_days` and the fire weather indices `ffmc`, `dmc`, `dc`, `isi`, `bui`, `fwi`. Any subset; the rest counts as unknown. Used by the weather model (below) |
| `started_at` | date and time | When the incident started |
| `as_of` | date and time, optional | The moment the forecast starts from. Default: now |
| `horizons_minutes` | 1 to 8 integers, optional | Minutes after `as_of`, each from 1 to 10080 (one week). Default: 60, 180 and 360 (1, 3 and 6 hours) |

## Response

The answer holds one [Prediction](../ms2-elaboration/data-model.md) of type incident progression per horizon, with what they share on top.

| Field | Meaning |
| --- | --- |
| `incident_id` | As sent |
| `model_version` | The model that answered (`baseline-outcomes-v1` until a trained model serves this call) |
| `generated_at` | When the forecast was produced |
| `input_data_timestamp` | The moment of the data it started from (`as_of`) |
| `input_data` | What it was based on (below) |
| `predictions` | One entry per requested horizon, in time order (below) |

`input_data`:

| Field | Meaning |
| --- | --- |
| `basis` | What the estimate is computed from |
| `snapshot` | The dataset it was computed from |
| `scope` | The narrowest group of past incidents with enough history: type, then severity, then zone |
| `similar_incidents`, `still_open_at_as_of` | Incidents in that group, and how many lasted longer than this one has so far |
| `incident_fields` | The request fields that were used |
| `sources` | `name` and number of `incidents` for each source that reported the similar incidents. The CoreAPI stores them in `prediction_source` |
| `data_origins` | Real or mock rows among the similar incidents |
| `area_basis` | What the projected area is computed from, or `null` |
| `area_model` | `weather model, trained on snapshot …` or `percentiles by zone (history only)` |
| `weather_used` | The weather fields the area model had. Empty: it ran without weather |
| `weather_day` | The day the weather comes from, when it was derived from `weather_days` |
| `terrain_used` | The terrain fields it had, sent or found from the coordinates. Empty: no past fire nearby |

Each entry of `predictions`, and the `prediction` column it fills:

| Field | Column | Meaning |
| --- | --- | --- |
| `horizon_minutes` | `time_horizon` | The horizon, as requested |
| `risk_score` | `risk_score` | Chance the incident is still open at `as_of` plus the horizon, 0 to 1 |
| `risk_score_low`, `risk_score_high` | | 95% interval of the risk score, wide when history is short |
| `confidence_level` | `confidence_level` | 0 to 1: how much similar history supports the horizon |
| `trust_percent` | | 0 to 100: how well forecasts like this one told large fires from the rest in a test on fires the model never saw, scaled by how many large fires it learned from (below). `null` without a promoted model |
| `large_fire_probability` | | If the fire is still burning at that horizon, the chance it ends at 100 hectares or more, the ICNF definition of a large fire |
| `large_fire_base_rate` | | The usual chance of a large fire for fires of that age. Read the probability against it: 5% means little next to a base rate of 27% and a lot next to 0.8% |
| `large_fire_alert` | | `high` (the riskiest 10% of fires of that age on the validation days), `elevated` (the next 10%) or `normal`. `null` without a promoted model |
| `escalation_probability` | | Chance the incident needs more units than first sent. `null` when the history has none. The same for every horizon: the sources do not record when an incident escalated |
| `expected_units_needed` | | Mean units sent to similar incidents. `null` when unknown |
| `projected_area` | `projected_area` | GeoJSON polygon the COP draws on the map: the median final area. `null` without a location or without enough burnt-area history |
| `projected_area_inner`, `projected_area_outer` | | The same with the 10th and the 90th percentile of the final area: the range the COP draws around the median |
| `projected_area_if_large` | | The median large fire (100 hectares or more) of that age, as a circle: the worst case to plan for, since the range above never reaches a large fire early |

The AI service does not say which units an escalation needs: the history records how many were sent, not their type.

### Example

Request: `{"incident_id": "812", "incident_type": "forest_fire", "zone": "30", "latitude": 40.5, "longitude": -8.5, "started_at": "2026-08-01T13:50:00Z", "as_of": "2026-08-01T14:00:00Z", "weather": {"temperature_max": 34, "relative_humidity_min": 22, "wind_speed_max": 28}}`, with the default horizons.

```json
{
  "incident_id": "812",
  "model_version": "baseline-outcomes-v1",
  "generated_at": "2026-08-01T14:00:03Z",
  "input_data_timestamp": "2026-08-01T14:00:00Z",
  "input_data": {
    "basis": "outcomes of past incidents (duration, escalation, units sent, burnt area)",
    "snapshot": "20261114T101500Z",
    "scope": "type and zone",
    "similar_incidents": 140,
    "still_open_at_as_of": 62,
    "incident_fields": ["incident_type", "started_at", "as_of", "zone", "weather", "latitude", "longitude"],
    "sources": [{"name": "ICNF", "incidents": 62}],
    "data_origins": {"real": 62},
    "area_basis": "final burnt area (10th, 50th and 90th percentile) if the fire is still burning at each horizon, predicted from the zone, the hour, the month and the weather, as circles around the incident (the history records the final area only)",
    "area_model": "weather model, trained on snapshot 20261114T101500Z",
    "weather_used": ["relative_humidity_min", "temperature_max", "wind_speed_max"]
  },
  "predictions": [
    {"horizon_minutes": 60, "risk_score": 0.81, "risk_score_low": 0.69, "risk_score_high": 0.89, "confidence_level": 0.67,
     "trust_percent": 56, "large_fire_probability": 0.06, "escalation_probability": 0.12, "expected_units_needed": 6.4,
     "projected_area": {"type": "Polygon", "coordinates": [[[-8.5, 40.5], "..."]]},
     "projected_area_inner": {"type": "Polygon", "coordinates": ["..."]}, "projected_area_outer": {"type": "Polygon", "coordinates": ["..."]}},
    {"horizon_minutes": 180, "...": "...", "trust_percent": 42, "large_fire_probability": 0.11},
    {"horizon_minutes": 360, "...": "...", "trust_percent": 34, "large_fire_probability": 0.19}
  ]
}
```

(The figures of the example are illustrative.)

## How it is computed

**Chance the incident is still open, escalation and units** come from a baseline over past incidents. Among past incidents of the same type that lasted at least as long as this one has so far, narrowed to its severity and zone when each has at least 30 incidents, the share that lasted past each horizon is the risk score. Escalation and units are the means over the same incidents. Confidence is `n / (n + 30)`, where `n` is how many such incidents there are.

**Projected area and large-fire chance** for a rural fire come from a model trained on real fires (`ai_service/dataset/fire_progression.py`). It learns from the zone, the hour and month of ignition, the weather of that zone and day (wind, humidity, drought and the fire weather indices) and the terrain of the place (altitude, slope, sun exposure, road network density, land-cover variety), and it is trained again with every dataset build. A trained model answers only once it has been checked and promoted (see [AI monitoring](ai-monitoring.md#how-to-retrain)); until then, and if its files no longer match their recorded hashes, the answer falls back to percentiles of past fires of the zone. There is one set of models per time the fire has already lasted (just reported, 1, 3 and 6 hours). Each horizon is answered by the set for the age the fire would have then, so the 1, 3 and 6 hour forecasts differ: a fire still burning after 6 hours is a different, harder fire than a new one.

The area is three circles around the incident with the 10th, 50th and 90th percentile of the final area, if the fire is still burning at that horizon. It is not the area burnt by then: no open dataset records how a fire's area grows over time, only its final area. Training that would need satellite detections over the fire's life (for example NASA FIRMS VIIRS, which warns against using its points to measure burnt area) or the operator's own area updates once the platform stores them.

**Trust percentage.** It is the Gini of the large-fire model for that age on the test fires (2 × AUC − 1: 0 is a coin toss, 100 a perfect ranking), multiplied by how many large fires the model learned from (`n / (n + 30)`). It falls as the horizon grows, because after hours of burning the weather says less about the fire. With no weather in the request it uses the score of the same model with the weather hidden.

## Evidence

All results are on real rural fires the models never saw: the last 20% of the days with a rural fire (2023-12-22 to 2026-11-10), after training on the first 60% and stopping on the next 20%. Days are counted among those with a fire, so this test starts earlier than the one of the daily risk models in the [training dataset](training-dataset.md), which counts every day. The dataset is the training package built on 2026-11-15; it can be rebuilt and re-scored with `python -m dataset.fire_progression --dataset <snapshot>/dataset`.

### The dataset matches the official statistics

The ICNF 7.º Relatório Provisório de Incêndios Rurais 2024 (1 January to 30 September 2024) gives the national figures the dataset can be held against.

| 2024, to 30 September | ICNF report | Dataset |
| --- | --- | --- |
| Rural fires | 6 319 | 5 994 (95%) |
| Burnt area | 135 058 ha | 137 108 ha |
| Large fires (100 ha or more) | 79 | 82 |
| Share of the burnt area in large fires | 93% | 92.8% |
| Fires under 1 ha | 5 284 | 4 903 |
| Fires of 1 to 10 ha | 745 | 708 |
| Fires of 1 000 ha or more | 22 | 25 |

The dataset holds about 5% fewer fires than the official count, almost all of them small, and the same large fires and area. The report's fire danger classes (DSR) cannot be reproduced yet: the dataset computes the Fire Weather Index from daily reanalysis weather, which runs high, and puts 1 281 fires in the top class where the report has 517. The models learned from the same index, so the `weather` sent to them should be computed the same way (see Limits).

### Weather tells large fires apart

Chance of a large fire (100 ha or more), for a fire just reported, on the test period (265 large fires among 23 849). These first figures come from the model before the terrain was added; the terrain's gain is shown below.

| | AUC | Log loss |
| --- | --- | --- |
| Baseline: share of large fires by zone and month | 0.69 | 0.0611 |
| Weather model, without terrain | 0.82 | 0.0540 |
| Weather model, with terrain (in use) | 0.85 | |

An AUC of 0.5 is chance and 1 is perfect. What carries it was measured in a separate training run, also without terrain, so its figures compare only with each other and not with the table above:

| Inputs | AUC |
| --- | --- |
| Zone, hour and month only | 0.72 |
| Weather only (no zone) | 0.75 |
| Weather and zone | 0.83 |

- **Weather adds real information** beyond where and when a fire starts, and the two together do best.
- **Wind adds little at this resolution.** Removing the wind speed, ISI and FWI costs less than 0.01 of AUC. The dataset has the daily maximum wind, not the wind at the fire.
- **It stays useful as a fire lasts**, but less. AUC against the baseline, and the trust percentage with and without weather in the request:

| Fire has lasted | Large fires in the test | Weather model AUC | Baseline AUC | Trust, with weather | Trust, without |
| --- | --- | --- | --- | --- | --- |
| Just reported | 265 | 0.85 | 0.69 | 67% | 51% |
| 1 hour | 265 | 0.81 | 0.67 | 60% | 39% |
| 3 hours | 260 | 0.72 | 0.62 | 43% | 27% |
| 6 hours | 235 | 0.69 | 0.58 | 37% | 22% |

### What the terrain added

The ICNF record that the dataset comes from also holds the place of each fire (altitude, slope, sun exposure, road network density, land-cover variety), the weather at ignition (including the DSR that the ICNF reports use), the alert and first-intervention times and the alert source. The terrain is now part of the dataset and the model. The test looks the terrain up from the coordinates, from the fires of the training days only, as a forecast would, instead of using the fire's own record.

| Chance of a large fire (AUC) | Without terrain | With terrain |
| --- | --- | --- |
| Just reported | 0.82 | 0.85 |
| 1 hour | 0.79 | 0.81 |
| 3 hours | 0.72 | 0.72 |
| 6 hours | 0.68 | 0.69 |

- **The terrain helps most when the fire is new**, and little later: after hours of burning, what separates fires is how they behave, not where they started.
- **Coverage is 70%.** The rest of the fires (older years, other sources) have no terrain and the model treats it as unknown. A place with no past fire within about 2 km also gets none, and `terrain_used` says so.
- **Not worth adding:** the ICNF weather at ignition did not help on top of the reanalysis weather (AUC 0.80 against 0.83, in the comparison above), nor did the delay to the first intervention (no gain at 1, 3 or 6 hours).
- **The ceiling is about 0.85 at ignition.** More accuracy needs information the datasets do not have: how the fire is behaving after it starts (observed area, perimeter, resources committed). Once the platform holds the operator's area updates and the assignments, they are the inputs to add for the 3 and 6 hour forecasts.

### Alert levels

The alert cut-offs are the 90th and 80th percentile of the forecasts on the validation days. On the test days, for a fire just reported (the test holds more severe weather than the validation, so more than 10% of fires are flagged):

| Level, for a fire | Fires flagged | Of the flagged, became large | Large fires caught | Usual chance |
| --- | --- | --- | --- | --- |
| `high`, just reported | 3 098 of 23 849 | 4.6% | 54% | 1.1% |
| `elevated` or above, just reported | 5 866 | 3.5% | 78% | 1.1% |
| `high`, burning 1 hour | 1 304 of 9 388 | 10.4% | 51% | 2.8% |
| `high`, burning 3 hours | 235 of 2 088 | 32.8% | 30% | 12% |
| `high`, burning 6 hours | 88 of 891 | 65.9% | 25% | 26% |

A `high` alert on a new fire catches half of the fires that become large, and about 1 in 20 of the fires it flags does. It is a reason to look, not a prediction that the fire will be large.

### What it does not do well

- **It under-estimates in extreme weather.** In the highest fifth of predicted chance, 2.3% were predicted and 3.6% of the fires were large. The test holds September 2024, which burnt 92% of that year's area in a few days, beyond what the training years show.
- **The area range is only a little better than before.** For a fire just reported it holds 75% of final areas (the baseline 78%), and its error on log area is 3.6% lower. For large fires neither range holds any: a fire that becomes large is placed at about 0.1% of its final area at the median. Later it improves, because the fires still burning are the larger ones: the range holds 39% of the large fires after 6 hours. Use `large_fire_probability` to judge a fire's potential at ignition, not the area.
- **It is trained on rural fires with a recorded area.** Other incident types get the baseline only.

## How the CoreAPI calls it

`GET /api/incidents/{incident_id}/forecast?horizons=60&horizons=180` returns the answer above for an incident of the platform. `horizons` is optional (1 to 8 values of 1 to 10080 minutes; default 60, 180, 360). The CoreAPI reads, from the Global DB:

| What | From |
| --- | --- |
| Type, severity, start and place of the incident | The incident |
| Zone code | The municipality (the zone type the AI service was trained with, `AI_ZONE_TYPE`) that contains the place |
| Daily weather, 200 days before the fire and its own day | The observations of the nearest point of the 0.25 degree weather grid (within 0.5 degrees): `weather_daily` (Open-Meteo archive, ERA5, the data the models learned from) and, for the days it has not reached yet, `weather_forecast_daily` (Open-Meteo forecast API). Where both have a day, the archive wins |

The archive arrives about two days late, so the day of a fire that has just started comes from the forecast feed of the Open-Meteo plugin, refreshed every 3 hours for the whole grid. No incident coordinate leaves the platform: the weather is read from the platform's own database, which the plugin fills from points of a fixed grid.

The CoreAPI sends the service token with every call, and refuses to start without a strong one. If the AI service is down, slow (the call has a 10 second timeout) or refuses, the endpoint answers **503** with a message for the operator; the cause is logged, not shown. The map, the incidents, the observations and the alerts do not depend on this call and keep working.

## History of resources for the next models

The 3 and 6 hour forecasts will improve most from what is happening at the fire, so the platform now keeps it. On every Fogos.pt poll, when the resources sent to an incident, its status or the reading of its nearest weather station change, the Fogos.pt plugin appends one observation of type `incident_resources` linked to the incident: people, vehicles, aircraft, helicopters and planes, status code and the station weather. The state table `fogos_incident_detail` only keeps the latest values, which cannot show how the resources grew. The training intake sends these observations to the AI service (numbers only, no free text). After a fire season they give the models the resources committed at 1, 3 and 6 hours as inputs.

## Limits

- **The training weather is reanalysis.** The models learned from daily ERA5 values and the indices derived from them. The last two days come from the forecast API, which can differ a little from the reanalysis that will replace them.
- **The indices need months of weather in the platform.** With fewer than 150 days of daily weather at the place, the fire weather indices are left out and the model works from the raw values; `weather_used` says which it had. The archive feed only repeats the latest 10 days, so the history has to be loaded once (`OPENMETEO_BACKFILL_FROM`, or `tools/load_global_db.py`). On the dataset, 110 days of history left the drought code off by 48 on a mean of 496; 180 days brings that to 9.
- **Speed.** One forecast takes about 100 ms of one CPU core (most of it deriving the fire weather indices), 1 s for the first call of a worker. The AI service runs `AI_WORKERS` processes (default 4): on the dataset one worker answered 8 forecasts a second and four answered 29, with a median of 0.57 s when 16 were asked at once. Dataset builds and trainings are claimed through lock files, so any worker can start one and report it.
- **Weather needs a nearby grid point.** A place farther than 0.5 degrees from any point of the grid (outside mainland Portugal) gets no weather, and `weather_used` says so.
- **The resources history is not used by the models yet.** It starts accumulating when the plugin runs, and fires before that have none.
- **Trained on 2013 to 2026 Portuguese rural fires.** It does not describe other incident types or other countries.

## Errors

| Status | When |
| --- | --- |
| 422 | A horizon outside 1 to 10080 minutes, no horizon, or `started_at` after `as_of` |
| 404 | The latest dataset has no incidents of that type |
| 503 | No dataset with incident outcomes has been built yet |
| 404 (`Not Found`) | No valid service token in the `Authorization` header. The answer does not say that a token is missing, so a caller without one learns nothing about the routes |

The AI Client turns every one of these, a timeout, a refused connection or a reply that is not JSON into `AiServiceError`, and the CoreAPI turns that into a 503.

## Where it lives

| Part | Code (private backend repository) |
| --- | --- |
| Endpoint | `ai_service/app/predictions.py` |
| Service token and promoted models | `ai_service/app/auth.py`, `ai_service/app/model_registry.py`, `ai_service/app/model_promotion.py` |
| Weather model: training, evaluation, serving | `ai_service/dataset/fire_progression.py` |
| Weather features from daily values | `ai_service/dataset/live_weather.py` |
| CoreAPI endpoint, inputs and failure handling | `core_api/app/business/services/forecasts.py`, `core_api/app/presentation/routers/forecasts.py` |
| Forecast weather feed | `ingestion_worker/app/openmeteo_plugin.py` (feed `weather_forecast`) |
| History of resources and weather per incident | `ingestion_worker/app/fogos_plugin.py` (`incident_resources`) |
| Percentile fallback and its backtest | `ai_service/dataset/area_backtest.py` |
| Call, timeout and failure handling | `AiClient.incident_progression` in `core_api/app/persistence/ai_client.py` |
