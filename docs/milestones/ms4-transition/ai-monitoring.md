---
title: AI monitoring and retraining
date: 2026-11-17
order: 4
description: How the forecasts are checked against what happened once they are in use, and when and how the models are retrained
---

# AI monitoring and retraining

<p class="ad-lede">A model that was good on its test days can stop being good once it is in use: the fire seasons change, the sources change, the data that reaches it changes. This page explains how the platform checks every forecast against what really happened, what it flags, and the criteria the team uses to decide when a model has to be retrained.</p>

## Summary

- **Every automatic forecast is stored** with its model version, the dataset it came from, its inputs, its confidence and when it was made. Each one can be traced back to what produced it.
- **Once its horizon has passed, it is compared with what happened.** For an incident forecast: was the incident still open at that moment? For an [occurrence risk forecast](occurrence-risk.md): did an incident of that type start in that municipality that day? The scores are the same as in the [model evaluation](training-dataset.md): Brier score, log loss and AUC, next to a baseline.
- **One monitor per kind of forecast.** Each kind of stored forecast has a monitor that says how it is compared with what happened and which inputs are checked for drift. Today there are two: the incident progression and the occurrence risk of rural fires. Adding a kind of forecast means adding a monitor, not changing the checks.
- **Four things are watched:** the accuracy over time, whether the probabilities and the confidence can be trusted, whether the inputs have moved away from the training data, and the state of the AI service.
- **The platform flags; the team decides.** A flag never retrains anything on its own. The criteria below say when a flag is a reason to retrain, and the decision is recorded by a person.
- **The thresholds are the team's proposal** and are still to be agreed with the advisors.

## Where to see it

In the private application, **Monitorização da IA** (sidebar or command palette). It is available to authenticated stations only: every request carries the station number, and the CoreAPI refuses it without one. All its text is in Portuguese.

| Part of the page | What it shows |
| --- | --- |
| Status | Alerts and warnings of the last 30 days, what could not be checked and why, and whether retraining is suggested |
| Key figures | Skill over the baseline, calibration error, share of failed requests to the AI service, inputs that changed |
| 01 Forecast accuracy | Per monitor, model and horizon: forecasts compared, Brier score, baseline, skill, AUC and hit rate, and the Brier score over time next to the baseline |
| 02 Reliability | A reliability diagram (forecast against what happened) and the hit rate per level of confidence |
| 03 Input data | Per variable, the Population Stability Index (PSI) against the training fires, and the mean in training against the recent mean |
| 04 AI service | Requests, errors and response time per period and per endpoint, and the latest errors |

## What is stored

The CoreAPI makes the forecast of every open incident without anyone asking: a background task looks every minute for open incidents with no forecast in the last hour, those never forecast first, and asks the AI service. Each horizon (1, 3 and 6 hours) is one row of `prediction` in the Global DB:

| Field | Holds |
| --- | --- |
| `model_version` | The model that answered |
| `input_data` | The request sent (type, severity, zone, place, start, the weather of the day) and what the AI service says it used, including the dataset (`snapshot`) |
| `confidence_level`, `risk_score`, `time_horizon` | The forecast |
| `generated_at`, `input_data_timestamp` | When it was made, and the moment of the data it started from |
| `details` | The rest of the horizon: interval of the risk score, large-fire chance, the projected areas |
| `origin` | `automatic`, or `manual` for a scenario a station ran by hand (with `created_by`) |

At most one forecast per incident, model and horizon is stored per hour, so an incident opened many times does not fill the table with the same forecast. Forecasts of the same incident made hours apart are kept on purpose: the 6 hour forecast made at 10:00 and the 1 hour forecast made at 15:00 both point at 16:00, and comparing them shows how accuracy falls with the horizon.

**Manual scenarios are never judged.** A station can ask for a forecast with the weather or terrain it chooses, to test a scenario. Its inputs are hypothetical, so there is nothing real to compare it with: it is stored as `manual` and left out of every score.

**Occurrence risk forecasts are stored the same way**, one row per municipality and day of each daily issue, with the municipality in `zone`, the days ahead in `time_horizon`, and the level, the factors and the weather in `details`. Every issue is kept; see [Occurrence risk](occurrence-risk.md).

**Every call to the AI service is logged** (`ai_call_log`): endpoint, response time, and the error when it failed. The pages of a training upload are not, as they are not requests to monitor.

## How a forecast is judged

| Monitor | The forecast is | What happened is |
| --- | --- | --- |
| `incident_progression` | The chance the incident is still open at the horizon | The incident's end date, as it is now |
| `occurrence_risk/<type>` | The chance of at least one incident of the type in the municipality that day | Whether a source reported an incident of that type starting there that day (Lisbon time). Incidents created by operators do not count, as in the training data |

An occurrence forecast enters the scores once its day has ended, plus the same 3 hours. Its horizon is the days ahead: the forecast for today, for tomorrow made today, and so on, are scored apart.

For the incident progression, the forecast is "the chance the incident is still open at the horizon". What happened is read from the incident as it is now: still open (no end date, or an end after the horizon) or closed before it.

A forecast enters the scores only when:

- **its horizon has passed, plus 3 hours.** Sources can report that a fire ended a while after it did. The 3 hours leave room for that, and because the outcome is read when the page is opened, a late end date still corrects the score;
- **the incident was open when the forecast was made.** A forecast for an incident already closed says nothing about the model;
- **it is automatic.** Manual scenarios are left out.

| Score | Reads as |
| --- | --- |
| Brier score | Mean squared error of the probability. 0 is perfect, lower is better |
| Baseline | The Brier score of always forecasting the share of incidents still open at that horizon in the same period. A forecaster with no skill but a good sense of how long incidents last |
| Skill | 1 − Brier ÷ baseline. Above 0 the model beats the baseline, 0 is no better, below 0 is worse |
| AUC | Whether the incidents that stayed open got higher forecasts than those that closed. 0.5 is chance, 1 is perfect |
| Hit rate | Share right when a forecast of 50% or more is read as "still open" |
| Calibration error | Of the forecasts of about 30%, did about 30% stay open? The gap between forecast and outcome, averaged over all forecasts |

**Confidence.** The forecasts the AI service was more confident about should be right more often. The page shows the hit rate and Brier score per band of confidence. If they do not improve with the confidence, the stated confidence cannot be trusted.

A model is told apart by its version and the dataset it was computed from (`baseline-outcomes-v1 @ 20261115T224118Z`). A model retrained on a newer dataset therefore appears on its own row, next to the one it replaces.

## Input drift

The models learned from the real rural fires of their dataset. If the weather the forecasts get today is unlike that, the model is answering outside what it knows. For each variable the platform compares the inputs of the recent forecasts (one per incident, so a fire forecast every hour counts once) with the fires the model was trained on, using the Population Stability Index:

| PSI | Reading |
| --- | --- |
| Below 0.1 | Stable |
| 0.1 to 0.25 | Moderate change |
| 0.25 or more | Significant change |
| Fewer than 30 incidents | Not enough data to say |

The variables are the maximum temperature, minimum relative humidity, maximum wind, precipitation, and the hour and month the fire started (Lisbon time). The AI service holds the training data, so it computes the index; the CoreAPI sends it only the numbers.

For the occurrence risk, the inputs are those of the same-day forecast of each municipality and day (the weather and the month), compared with the municipality-days of the training data of that type. Each monitor names the training data it is compared with.

**Month and hour drift with the season, and that is expected.** The training fires span the whole year, so in winter the month of recent fires is far from the training months. A drift on month or hour alone is never a reason to retrain, so it is raised as a warning only, whatever its size. A drift on the weather is.

## Flags

The flags look at the last 30 days. Fewer than 30 compared forecasts, or 30 requests, raise nothing: a few bad forecasts are not a trend. The page then says what could not be checked.

| Flag | Raised when | Level | Setting (CoreAPI) |
| --- | --- | --- | --- |
| Accuracy | A model and horizon no longer beats the baseline (skill below 0) | Alert | `MONITORING_MIN_BRIER_SKILL` = 0 |
| Calibration | The calibration error of a model is above 0.10 | Warning | `MONITORING_MAX_CALIBRATION_ERROR` = 0.10 |
| Input drift | A weather variable has a PSI of 0.25 or more | Alert | `MONITORING_DRIFT_PSI` = 0.25 |
| Input drift | The hour or the month has a PSI of 0.25 or more | Warning (it follows the season) | |
| Input drift | A variable has a PSI from 0.1 to 0.25 | Warning | |
| AI service, errors | More than 10% of the requests failed | Alert | `MONITORING_MAX_ERROR_RATE` = 0.10 |
| AI service, speed | 95% of the requests to an endpoint take longer than 5 seconds | Warning | `MONITORING_MAX_P95_MS` = 5000 |

Every monitor is checked with the same thresholds, and each flag names its monitor. The period is `MONITORING_WINDOW_DAYS` (30), the minimum sample `MONITORING_MIN_SAMPLE` (30) and the wait after a horizon `MONITORING_GRACE_SECONDS` (10 800). The page shows the limits in force.

## When to retrain

The page suggests a retrain when there is an accuracy or a drift alert. The team then decides, with these criteria.

**Retrain when any of these holds:**

1. **The model no longer beats the baseline.** An accuracy alert (skill below 0 over at least 30 compared forecasts in 30 days) for any horizon. If it holds for one horizon only, look at that horizon first: the 6 hour forecast is the hardest and the first to fall.
2. **The weather inputs have changed significantly.** A drift alert (PSI of 0.25 or more) on temperature, humidity, wind or precipitation, over at least 30 incidents. The model is answering for weather it did not learn from.
3. **The probabilities stay wrong.** A calibration warning in two 30-day periods in a row. A single period can be one unusual week of fires.
4. **A fire season has ended.** Once a year, after the critical period of rural fires (from October), with that season's fires and weather in the dataset. This also brings in the history of resources the Fogos.pt plugin keeps for each incident, which the next models need.
5. **A source the model learned from has changed** (a new source, a source that stopped, a change in how a source reports). The training data no longer looks like what arrives.

**Do not retrain because of:**

- **AI service errors or slowness.** They are a problem of the service, not of the model: look at the latest errors, the resources of the AI service and its logs.
- **A drift on month or hour alone.** It follows the season (see above).
- **A moderate drift alone**, or a flag on fewer than 30 forecasts.
- **A single bad day or week.** The flags look at 30 days for that reason.

**Before retraining, check the data.** A sudden drop can come from a source that changed, an incident that was never closed (it stays "still open" for ever and pushes the baseline up), or weather that stopped arriving. A model retrained on broken data is worse, not better.

## How to retrain

1. **Take a new snapshot from the Global DB and train on it.** From the private backend repository:

    ```bash
    export AI_SERVICE_TOKEN=...   # the same token the CoreAPI uses; never passed as an option
    python tools/send_snapshot_from_db.py --dsn postgresql://user:pass@host/globaldb \
        --service http://ai_service:8000 --start 2013-01-01 --end <yesterday> --train
    ```

    The CoreAPI repositories read the tables, the AI Client sends them, and the AI service builds the dataset and trains the models. The models are evaluated on their test days as part of the training (`model_metrics` in the snapshot status). A trained model stays in its snapshot and is not used yet.
2. **Check the results before relying on them.** The new model has to beat the baseline on its test days by the margins of the [model evaluation](training-dataset.md) (0.01 of AUC, or 2% of an error), and must not do worse than the model it replaces on the same test. Both can be scored again with one command each: `python -m dataset.model --dataset <snapshot>/dataset` and `python -m dataset.fire_progression --dataset <snapshot>/dataset`.
3. **Promote it, or leave it out.** Only a promoted model answers forecasts. If it passed step 2, promote it with the `ai_model_admin` tool (no network, no token) and restart the AI service:

    ```bash
    docker compose run --build --rm ai_model_admin promote <snapshot> --by "<name>"
    docker compose restart ai_service
    ```

    The promotion copies the snapshot's models from `ai_data` to `ai_promoted`, which the AI service mounts read-only, and records the SHA-256 of every file, the snapshot, who promoted it and when. Only data formats are accepted (LightGBM text models, JSON, CSV), never a file that could run code when loaded. If the promotion fails, the model in production stays as it was. A model that fails step 2 is simply not promoted: the service keeps the one it has.
4. **Watch the new model.** It appears in the monitoring as its own row, `version @ snapshot`, next to the old one. Compare them over the next 30 days.
5. **Record the decision**: who decided, why, the snapshot, and the test results, in the meeting minutes.

The AI service checks the promoted files against their recorded hashes before it starts and again before it loads them, and refuses to start if one differs, is missing or is not recorded. With nothing promoted, it starts and takes the projected area and the large-fire chance from the history of past fires. The risk score still comes from the latest dataset built, which a new snapshot replaces as soon as it is built.

## Limits

- **Of the incident forecasts, only the chance that the incident is still open is judged.** The Global DB holds no final burnt area for incidents, so the projected area and the large-fire chance cannot be scored in use yet. They are judged only on the test days of the [Prediction API](prediction-api.md) evaluation.
- **The baseline model is the one in use.** Until a trained model answers the risk score, the forecasts compared are those of `baseline-outcomes-v1`, and the comparison is with a forecaster with no skill. Once a trained model answers, both can be compared on the same incidents.
- **The outcome is only as good as the end dates.** An incident a source never closes counts as still open.
- **The response times are seen from the CoreAPI**, the AI service's only caller. They include the network between the two.
- **The input drift covers the raw weather, the hour and the month.** The fire weather indices and the terrain are computed inside the AI service and are not stored with each forecast.
- **Occurrence outcomes depend on the sources' coverage.** A day a source did not report counts as a day with no incident in every municipality.
- **Forecasts of counts and amounts have no monitor yet.** Every monitor today scores a probability against a yes or no outcome; arrivals, durations or areas would need a monitor with their own scores.
- **The call log has no retention yet.** It grows with the forecasts, a few rows an hour per open incident.

## Where it lives

| Part | Code (private repositories) |
| --- | --- |
| Storing the forecasts | `core_api/app/persistence/repositories/prediction.py` |
| Automatic forecasts of the open incidents | `core_api/app/business/services/forecast_refresher.py` |
| Manual scenarios | `POST /api/forecasts/scenario`, `core_api/app/presentation/routers/scenarios.py` |
| Scores (Brier, log loss, AUC, calibration) | `core_api/app/business/domain/forecast_scores.py` |
| The monitors (one per kind of forecast) | `core_api/app/business/services/monitors.py` |
| Accuracy, operations, drift and flags | `core_api/app/business/services/monitoring.py` |
| Endpoints | `GET /api/ai/monitoring/monitors`, `/accuracy`, `/operations`, `/drift`, `/flags`; `accuracy` and `drift` take `monitor` |
| Call log | `ai_call_log`, written by the AI Client (`core_api/app/persistence/ai_client.py`) |
| Drift against the training data | `POST /monitoring/drift`, `ai_service/app/monitoring.py` |
| Dashboard | `frontend-private/src/sections/aiMonitoring/` |
| Retraining from the database | `tools/send_snapshot_from_db.py` |
| Promotion and the hash registry | `ai_service/app/model_promotion.py`, `ai_service/app/model_registry.py` |
