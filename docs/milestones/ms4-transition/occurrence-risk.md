---
title: Occurrence risk forecast
date: 2026-11-25
order: 5
description: The risk level of every municipality for today and the next days, the factors behind it, and how it reaches the COP
---

# Occurrence risk forecast

<p class="ad-lede">The control room needs to prepare before incidents happen. This page explains how the platform forecasts, for every municipality and for today and the next three days, the chance of at least one rural fire, the risk level the COP draws, the factors behind it, and what happens when the AI service does not answer.</p>

## Summary

- **One forecast a day.** The CoreAPI issues it each day for every municipality and stores it whole. The COP shows the stored forecast for the day.
- **A level and its reasons.** Each municipality and day gets:
    - a chance from 0 to 1;
    - one of five levels, from reduced to maximum, the same classes as the IPMA fire danger;
    - the usual chance for that municipality and month, to read the forecast against;
    - the factors that raise or lower it;
    - the weather it used.
- **Every forecast says where it comes from:** when it was generated, which model and dataset produced it, and the moment of the data it started from.
- **A failure stays in the risk layer.** If the AI service does not answer, the COP shows the last forecast, marked as out of date. If there is none, the risk layer says the forecast is unavailable. The map, incidents and alerts do not depend on it.
- **It is monitored like the incident forecasts.** Each municipality and day is compared with the incidents the sources reported there (see [AI monitoring](ai-monitoring.md)).

## How it is computed

The model is the occurrence risk model of the [training dataset](training-dataset.md): the risk of a rural fire by municipality and day, with an AUC of about 0.86 against 0.79 for the baseline on the test days (0.857 against 0.788 in the training package of 15 November 2026).

For each municipality, the CoreAPI sends the AI service:

- **The daily weather** of the grid point nearest to the municipality's centre. It covers the 200 days before the forecast, so the fire weather indices can be computed (the drought code has a long memory), and the forecast days. The archive is preferred where it has the day; otherwise the Open-Meteo forecast, which covers today and the next three days.
- **The rural fires reported by the sources in the 30 days before**, per day. Incidents created by operators are left out, as in the training data.

The AI service turns the weather into the same inputs as the training dataset (dry days, fire weather indices) and answers for every municipality and day.

| Output | Meaning |
| --- | --- |
| `risk_score` | Chance of at least one rural fire in the municipality that day |
| `level` | Reduced, moderate, high, very high or maximum |
| `baseline_rate` | The usual chance for the municipality and month, from the history |
| `confidence_level` | How much history of the municipality and month supports it, `n / (n + 30)` |
| `factors` | The effect of each group of inputs on this forecast, largest first |
| `weather`, `weather_day` | The weather inputs used, and the day they come from |

**Levels.** The cut-offs between the levels are the 50th, 80th, 95th and 99th percentiles of the model's forecasts on the validation days. Half of the municipality-days of that period are reduced and the top 1% maximum. They are fixed at training and saved with the model, with the share of municipality-days that had a fire at each level on the test days. A level is only useful if that share grows with it.

**Factors.** The contribution of each input to the forecast (SHAP values from LightGBM, on the log-odds scale), grouped as:

- temperature;
- humidity;
- wind;
- precipitation (with dry days);
- the fire weather indices;
- recent incidents;
- the municipality;
- the time of year.

A positive value raises the risk against the average forecast; a negative one lowers it.

**Without a model in production** the answer is the usual chance of each municipality and month (`baseline-monthly-rate-v1`), with no level and no factors, and the COP says so. As for the incident forecasts, a trained model answers only once it is promoted (see [AI monitoring](ai-monitoring.md#how-to-retrain)).

## How the COP gets it

`GET /api/risk/occurrence?incident_type=forest_fire` returns the stored forecast of the day, grouped by municipality, with the days in order. If none has been issued yet, the CoreAPI issues it on the spot.

A background task issues it each day for the types in `RISK_FORECAST_TYPES` (default `forest_fire,fire,structure_fire`: forest fires, agricultural fires and urban fires, the types with real history), for `RISK_FORECAST_DAYS` days (default 4). Each issue is stored in `prediction`: one row per municipality and day, with the municipality in `zone`.

| Situation | Answer |
| --- | --- |
| Today's forecast exists | That forecast |
| None yet today, AI service answers | A new forecast, stored |
| None yet today, AI service down | The last forecast, with `stale: true` and the reason |
| Never issued, AI service down | 503, and the risk layer says the forecast is unavailable |
| A type with no forecast | 422 |

The COP colours each municipality by its level for the selected day. Choosing a municipality shows its level, its chance next to the usual one, the weather used and the factors.

## Limits

- **The days ahead use today's history.** The recent-incident inputs are those of the day the forecast is issued: tomorrow's history does not exist yet.
- **The weather point is the nearest to the municipality's centre.** Training used the point nearest to the municipality's incidents, so in large municipalities the two can differ.
- **Fires only, for now.** Forest, agricultural and urban fires have real history; the other types have mock history only (see [training dataset](training-dataset.md)), and a forecast is never made from mock data: asked for one of them, the AI service answers it is not ready. In the COP the panel lists the incident types of the risk history and says so for those. A type is added by listing it in `RISK_FORECAST_TYPES` once its model is trained on real data.
- **The levels are relative.** They rank a municipality-day against the forecasts of the validation period. They are not the IPMA's official fire danger thresholds.
- **The level cut-offs and the percentiles are the team's proposal**, still to be agreed with the advisors.

## Where it lives

| Part | Code (private repositories) |
| --- | --- |
| Model, levels and factors | `POST /predictions/occurrence-risk`, `ai_service/app/occurrence.py`; cut-offs at training in `ai_service/dataset/model.py` |
| Inputs per municipality | `core_api/app/persistence/repositories/zone_risk.py` |
| Daily issue, stale answer, background task | `core_api/app/business/services/zone_risk.py` |
| Storage | `ZoneRiskStore` in `core_api/app/persistence/repositories/prediction.py` |
| Endpoint | `GET /api/risk/occurrence`, `core_api/app/presentation/routers/risk.py` |
| Monitor | `OccurrenceMonitor` in `core_api/app/business/services/monitors.py` |
| Risk layer and section | `frontend-private/src/data/riskApi.ts`, `src/stores/risk.ts`, `src/sections/risk/RiskSection.tsx` |
