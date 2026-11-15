---
title: Public Incident Fields
nav_title: Public incident fields
description: Which incident and warning data citizens can see in the public app, and how an incident becomes public
group: Data & API
order: 1
date: 2026-11-08
hide:
  - navigation
---

# Public Incident Fields

<p class="ad-lede">The public app shows citizens where emergencies are and what to do about them. It never shows how the control room responds. This page lists the only incident and warning fields that leave the private side, and the rule for publishing an incident.</p>

<div class="ad-meta" markdown="1">
<span>**Based on:** [data model](../milestones/ms2-elaboration/data-model.md), [GDPR analysis](gdpr-compliance.md)</span>
</div>

## When an incident is public { #rule }

An incident is public only when all of these are true:

1. An operator **validated** it.
2. An authorized private app **published** it. The incident records when and by whom.
3. Its status is not `closed`.

A public incident is never a copy of the private record. The private side builds a new record from an allow-list of fields, so a field that is not listed below cannot reach the public side, even by mistake. The public side rejects any record that carries an extra field.

## Public incident fields { #public-fields }

Required fields are always present. Optional fields are sent only when the private side has them, and they do not depend on the incident type.

| Field               | Type                            | Required | Meaning                                                                                      |
| ------------------- | ------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `id`                | integer                         | yes      | Identifies the incident. The internal code (`INC-0418`) is not public.                       |
| `type`              | enum                            | yes      | `forest_fire`, `urban_fire`, `road_accident`, `flood`, `medical`, `hazmat`, `search_rescue`. |
| `severity`          | enum                            | yes      | `critical`, `high`, `moderate`, `low`.                                                       |
| `status`            | enum                            | yes      | `active`, `controlled`, `monitoring`. Closed incidents leave the public app.                 |
| `location`          | GeoJSON Point                   | yes      | Coordinates in WGS 84 (longitude, latitude). A line or an area is reduced to its centre.     |
| `started_at`        | date and time with zone         | yes      | When the incident started.                                                                   |
| `updated_at`        | date and time with zone         | yes      | Last update. Drives the "updated" label and the stale data warning.                          |
| `description`       | text                            | no       | Written for citizens. The internal description is never used.                                |
| `vehicles_on_scene` | integer                         | no       | A number only.                                                                               |
| `current_area`      | GeoJSON Polygon or MultiPolygon | no       | The area affected now.                                                                       |
| `forecast_area`     | GeoJSON Polygon or MultiPolygon | no       | The projected area, shown as a forecast and never as a fact.                                 |

Two more fields are added by the public side and are never sent by the private side:

| Field          | Type               | How it is computed                                                   |
| -------------- | ------------------ | -------------------------------------------------------------------- |
| `municipality` | text, may be empty | The municipality that contains `location`. Empty outside every zone. |
| `district`     | text, may be empty | The district of that municipality.                                   |

There is no place name field. Citizens see the municipality, computed from the coordinates, so every incident is named the same way.

## Public warning fields { #warning-fields }

A public warning is issued to citizens for an area, so issuing it is publishing it.

| Field         | Type                            | Required | Meaning                                                       |
| ------------- | ------------------------------- | -------- | ------------------------------------------------------------- |
| `id`          | integer                         | yes      | Identifies the warning.                                       |
| `message`     | text                            | yes      | What citizens are told.                                       |
| `severity`    | enum                            | yes      | `critical`, `high`, `moderate`, `low`.                        |
| `area`        | GeoJSON Polygon or MultiPolygon | yes      | Where the warning applies.                                    |
| `issued_at`   | date and time with zone         | yes      | When it was issued.                                           |
| `last_update` | date and time with zone         | yes      | Last update.                                                  |
| `incident_id` | integer                         | no       | The incident it refers to, only when that incident is public. |

- A warning is active while it has no end time. An ended warning leaves the public app.
- A warning does not need an incident. When an incident leaves the public app, the link on its warnings is cleared and the warnings stay.
- The operator who issued a warning is never public.

## Language { #language }

Text fields hold text in the default language. The application should be capable of translating the text to the supported languages, or this should be changed to have areas for each supported language.

## Never public { #never-public }

| Data                                                            | Why                                                              |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Internal description and source-specific attributes             | May hold names, phone numbers, vehicle plates or radio details.  |
| The data sources behind an incident                             | Shows how the platform gets its information.                     |
| Operators: who created, validated, published or issued anything | Personal data.                                                   |
| Assets: callsigns, owner agency, positions, crew size           | Operational security, and it would show where resources are not. |
| Assignments, orders, acknowledgements, recommendations          | The response plan.                                               |
| Alerts, observations, incident relations, audit log             | Internal workflow.                                               |
| Prediction scores, confidence, model version                    | Statistics that citizens could misread as a decision.            |
| Incident end date                                               | Closed incidents are not public.                                 |

Details about people involved in an incident (victims, callers, reporters) are not in the data model, and are never part of a public field.

## Publishing in the data model { #data-model }

Three columns on the incident record support publication.

| Column                         | Meaning                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `is_public`                    | The incident is published.                                |
| `published_at`, `published_by` | When and by whom. Both are set together with `is_public`. |
| `public_description`           | The citizen text. Empty when there is none.               |

The database enforces the rules: an incident can only be published once it is validated, and `published_by` is set exactly when `published_at` is. Unpublishing clears all three, and the audit log keeps the history. Warnings need no extra column.

## The public schema { #schema }

The public side accepts and returns incidents and warnings only in the shape described above. Each model lists its fields and rejects anything else, so an internal field cannot be returned by accident.

An incident with only its required fields:

```json
{
  "id": 424,
  "type": "road_accident",
  "severity": "moderate",
  "status": "active",
  "location": { "type": "Point", "coordinates": [-8.6538, 40.6405] },
  "started_at": "2026-08-12T15:20:00+01:00",
  "updated_at": "2026-08-12T15:20:00+01:00",
  "municipality": "Aveiro",
  "district": "Aveiro"
}
```

An incident with every optional field:

```json
{
  "id": 423,
  "type": "forest_fire",
  "severity": "high",
  "status": "active",
  "location": { "type": "Point", "coordinates": [-7.7042, 40.4211] },
  "started_at": "2026-08-12T14:02:00+01:00",
  "updated_at": "2026-08-12T14:40:00+01:00",
  "description": "Incêndio em mata.",
  "vehicles_on_scene": 6,
  "current_area": {
    "type": "Polygon",
    "coordinates": [
      [
        [-7.71, 40.42],
        [-7.69, 40.42],
        [-7.69, 40.43],
        [-7.71, 40.42]
      ]
    ]
  },
  "forecast_area": null,
  "municipality": "Seia",
  "district": "Guarda"
}
```

A warning that does not refer to an incident:

```json
{
  "id": 12,
  "message": "Evite a Serra da Estrela.",
  "severity": "high",
  "area": {
    "type": "Polygon",
    "coordinates": [
      [
        [-7.8, 40.3],
        [-7.6, 40.3],
        [-7.6, 40.5],
        [-7.8, 40.3]
      ]
    ]
  },
  "issued_at": "2026-08-12T14:10:00+01:00",
  "last_update": "2026-08-12T14:30:00+01:00",
  "incident_id": null
}
```
