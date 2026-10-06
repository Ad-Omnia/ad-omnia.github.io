---
date: 2026-09-30
order: 1
description: Personas for the command room and public application
---

# Personas

Ad Omnia is composed of two applications with distinct audiences:

- **Private application (command room):** runs on-premises in the command room of emergency and civil protection agencies. Used by commanders, operators and planners to manage incidents and resources.
- **Public application:** internet-facing. Lets citizens follow active emergencies and report incidents.

| Persona | Application | Role in the system |
| --- | --- | --- |
| [Command Room Operator](#command-room-operator) | Private | Monitors data, manages incidents, triages citizen reports |
| [Emergency Planner](#emergency-planner) | Private | Analyses history and simulates scenarios before events |
| [Citizen](#citizen) | Public | Follows active emergencies and reports incidents |

## Command Room Operator

**Name:** Sofia Marques\
**Age:** 34\
**Role:** Shift operator in the command room of a sub-regional emergency and civil protection command\
**Tech proficiency:** High. Works with several systems simultaneously during long shifts.

### Background

Sofia works in shifts in the command room. She monitors incoming occurrences, keeps incident records up to date, tracks the status and location of resources, and is the main point of contact with other agencies and field teams. During a crisis she handles a high volume of information under pressure and is responsible for deciding how resources are allocated and for keeping the public informed. Today, the information she needs is spread across radio, phone calls and several separate systems, and she spends critical time consolidating it before she can act.

### Goals

- Get a complete, up-to-date picture of the situation at a glance, with as little manual work as possible.
- Anticipate how an incident will evolve, not just react to it.
- Allocate resources quickly and be able to justify those decisions afterwards.
- Quickly find information from other agencies.

### Frustrations

- Information spreaded between different systems.
- Not knowing whether the data she sees is current or outdated.
- Information from different agencies arriving late, incomplete or contradictory.
- Having no record of why a decision was made when it is questioned later.

### What she needs from Ad Omnia

- A Common Operational Picture (COP) combining incidents, resources and relevant data from all agencies on one map.
- Automatic ingestion of external data sources, with a visible indication of when each was last updated.
- Tools to create, update and close incidents, track resources and log orders sent to field teams.
- Alerts when new incidents appear or relevant changes occur.
- Predictions of incident progression, with a clear indication of their confidence.
- Resource allocation and routing recommendations that she can accept, adjust or reject, with a log of every decision.
- A way to publish incidents and warnings to the public application.

## Emergency Planner

**Name:** Tiago Ferreira\
**Age:** 41\
**Role:** Technician at a municipal civil protection service\
**Tech proficiency:** High. Uses GIS tools and spreadsheets regularly.

### Background

Tiago's work happens mostly outside of active emergencies. He prepares the municipality for the wildfire season, plans the safety arrangements for large events such as festivals and pilgrimages, and analyses past occurrences to identify high-risk areas. He currently gathers historical data manually from several sources and has no way of simulating scenarios.

### Goals

- Identify high-risk areas and periods based on historical data.
- Simulate scenarios before large events or critical seasons.
- Produce reports that support planning decisions and requests for resources.

### Frustrations

- Historical data is scattered and in inconsistent formats.
- Plans are based on experience and intuition rather than data.
- No way to test a plan before it is needed.

### What he needs from Ad Omnia

- Access to historical incident data, filterable by area, period and type.
- Scenario simulation using the predictive engine and synthetic data.
- Export of maps, data and reports.

## Citizen

**Name:** Ana Costa\
**Age:** 38\
**Role:** Teacher, living in a rural area close to forest\
**Tech proficiency:** Medium. Uses her smartphone daily, does not install many apps.

### Background

Ana lives with her family in a village surrounded by forest. Every summer she follows the news about wildfires anxiously, often relying on social media posts of uncertain origin. When she sees smoke nearby, she does not know whether it has already been reported or whom to tell besides calling 112.

### Goals

- Know whether there is an active emergency near her home, her family or her route.
- Know what to do: which roads are closed, where to go, whether she should leave.
- Report what she sees quickly and know that it reached someone.

### Frustrations

- Contradictory or alarmist information on social media.
- Official information that is hard to find or not specific to her area.
- No feedback after reporting something.

### What she needs from Ad Omnia

- A simple map of active emergencies, not limited to wildfires.
- Actionable information: affected areas, road closures, shelter points.
- A quick way to report an incident with location and, optionally, a photo.
- Confirmation that her report was received.

## Out of scope

The following profiles were considered and are not covered as personas at this stage:

- **Field responder** (firefighter, INEM crew, police officer): the private application runs only in the command room, so field teams do not access it directly.
- **System administrator / data integrator:** connector configuration, permissions and monitoring are addressed as non-functional requirements.
