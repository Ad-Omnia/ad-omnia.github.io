---
date: 2026-10-01
order: 2
description: User stories for commanders, operators, analysts and citizens
---

# User Stories

## US-1: Real-time operational map

**As...** a control room operator,\
**I want...** to view on a single real-time map all active incidents and the location and status of resources from every agency, including aerial assets,\
**So that...** I have a complete and up-to-date picture of the situation without switching between multiple systems.

**Acceptance Criteria:**

- The system must display all active incidents on the map, georeferenced and identified by type and severity.
- The system must display the position and status of resources, visually distinguished by agency and resource type.
- The system must update incidents and resources automatically.
- The system must show the time of the last successful update of each data source and visibly flag sources that are unavailable or outdated.

## US-2: Map filtering and details

**As...** a control room operator,\
**I want...** to filter the map by data layers, geographic area and time period, and to view the details of any incident or resource,\
**So that...** I can focus on the information relevant to the situation I'm handling.

**Acceptance Criteria:**

- The system must allow the user to toggle layers by agency, resource type, incident type and data source.
- The system should allow filtering by region and by time window.
- The system must show the details of an incident or resource when selected.

## US-3: Incident and resource management

**As...** a control room operator,\
**I want...** to create, update and close incidents/operations, and update the status of resources,\
**So that...** the platform reflects the real situation, including occurrences reported by phone or radio.

**Acceptance Criteria:**

- The system must allow the user to create an incident with location, type, severity and description.
- The system must allow the user to update the severity and status of an incident and to close it.
- The system must allow the user to assign resources to an incident and update their status.
- The system must record who made each change and when.

## US-4: Order tracking

**As...** a control room operator,\
**I want...** to register the orders sent to field teams and track whether each one was acknowledged,\
**So that...** I can make sure every order reached its team and follow up on those that did not.

**Acceptance Criteria:**

- The system must allow the user to log an order associated with an incident and a resource, with an automatic timestamp.
- The system must allow the user to mark an order as acknowledged, recording the time of acknowledgement.
- The system must highlight orders that have not been acknowledged within a configurable period.
- The system must show the pending (unacknowledged) orders of each incident.

## US-5: Incident alerts

**As...** a control room operator,\
**I want...** to be alerted when a new incident is detected in the external feeds or when an existing incident changes significantly,\
**So that...** I can react quickly without having to constantly monitor the map.

**Acceptance Criteria:**

- The system must alert the user when a new incident is received from an external data source.
- The system must alert the user when an existing incident changes severity or status.
- The system must allow the user to acknowledge an alert and must keep unacknowledged alerts visible.
- The system should allow the user to configure which alerts to receive.

## US-6: Risk forecasting

**As...** a control room operator,\
**I want...** to view the predicted progression of an incident and the high-risk areas, along with the confidence level of each prediction,\
**So that...** I can anticipate how the situation will evolve and act before it worsens.

**Acceptance Criteria:**

- The system must display the predicted progression of a selected incident on the map for configurable time horizons.
- The system must display areas with high predicted risk for the coming hours.
- The system must show the confidence level associated with each prediction.
- The system must indicate when a prediction was generated and on which data it was based.

## US-7: Tactical recommendations

**As...** a control room operator,\
**I want...** to receive recommendations on which resources to assign to or release from an incident, and how to route them, and to be able to accept, adjust or reject them,\
**So that...** I can respond faster without losing control over the final decision.

**Acceptance Criteria:**

- The system must suggest which resources to assign/release to an incident, with a short justification.
- The system must show the recommended route for each suggested resource and its estimated arrival time.
- The system must allow the user to accept, adjust or reject a recommendation before it is applied.

## US-8: Decision log

**As...** a control room operator,\
**I want...** to consult the log of recommendations and decisions made during an incident,\
**So that...** I can justify the actions taken afterwards.

**Acceptance Criteria:**

- The system must record every recommendation generated, the decision taken, by whom and when.
- The system should allow the user to record an optional reason when rejecting or adjusting a recommendation.
- The system must display the log of each incident in chronological order.
- The system should allow exporting the log of an incident.

## US-9: Public communication

**As...** a control room operator,\
**I want...** to publish incidents and issue warnings on the public citizens' app,\
**So that...** the population receives reliable information during a crisis.

**Acceptance Criteria:**

- The system must allow the user to publish or hide a validated incident on the public app.
- The system must never publish unvalidated incidents or sensitive operational data.
- The system must allow the user to issue a warning for a geographic area, with a message and severity level.
- The system should allow the user to update or end an active warning.

## US-10: Consult historical incident data filtered by zone, period and type

**As...** an analyst,\
**I want to...** search historical incidents filtered by zone, time period and incident type,\
**So that...** I can analyze past activity and support planning decisions.

**Acceptance Criteria:**

- The search supports filtering by any combination of zone, date/time range and incident type, and returns results within a reasonable time for the expected data volume.
- Each result shows not only the incident's own data (location, type, status, timestamps) but also all directly related information: the incident's foreign-key relationships are followed to surface linked entities (e.g. assigned resources, reports, logs) and other incidents that reference it (e.g. a follow-up or a duplicate/merged incident).
- Related incidents and entities are clearly labeled with their relationship to the queried incident (e.g. "referenced by", "caused by", "merged into"), not just listed flatly.
- If no incidents match the filters, the system shows an explicit "no results" state rather than an empty or ambiguous screen.
- Access to historical data respects the same visibility rules as other operator views (no public exposure of internal-only fields).

## US-11: View zones and seasons of highest risk on a map

**As...** an analyst,\
**I want to...** see on a map which zones and time periods have historically had the highest incident risk,\
**So that...** I can anticipate where and when resources are most likely to be needed (to prevent repeated events).

**Acceptance Criteria:**

- The map displays zones color-coded or ranked by historical risk level, computed from past incident data (frequency, severity, type).
- The user can filter or select a time period (e.g. a season, a month range) to see how risk concentration shifts accordingly.
- Selecting a zone shows the underlying data behind its risk rating (incident count, types, trend over time).
- The map indicates the date range of the underlying data and when the risk calculation was last refreshed.

## US-12: Simulate scenarios before major events or fire season

**As...** an analyst,\
**I want to...** run simulations using the predictive engine and synthetic data before major events or the start of fire season,\
**So that...** I can anticipate likely demand and prepare resource allocation in advance as well as requesting help timely.

**Acceptance Criteria:**

- The user can configure a simulation with parameters such as time window, zone(s), expected event type, and synthetic/historical data inputs.
- The predictive engine produces a projected outcome (e.g. likely incident volume, severity distribution, resource demand) based on those parameters.
- Simulation results are clearly marked as predictive/synthetic and are visually distinct from real operational data, so they can never be mistaken for live incidents.
- Optional feature: Simulations can be saved, re-run with adjusted parameters, and compared against each other.
- Running a simulation has no effect on live operational data or active incident records.

## US-13: Simulate limit scenarios using maximum available resource capacity

**As...** an analyst,\
**I want to...** simulate limit/worst-case scenarios that use the maximum capacity of all available resources,\
**So that...** I can assess whether current resource levels are sufficient under extreme demand and identify breaking points.

**Acceptance Criteria:**

- The user can define a scenario where simulated demand is scaled up until it saturates all available resources (personnel, vehicles, equipment, etc.).
- The simulation reports the point at which resource capacity is exceeded, and which resource types run out first.
- Results clearly show gaps between demand and available capacity (e.g. unmet requests, response delays) under the simulated limit scenario.
- Results are clearly marked as synthetic/predictive, with no effect on live data or active incidents.

## US-14: Export maps, data and reports for planning and resource requests

**As...** an analyst,\
**I want to...** export maps, underlying data and reports,\
**So that...** I can support planning decisions and formal requests for additional resources with shareable documentation.

**Acceptance Criteria:**

- The user can export the current map view (including active filters/layers) as an image or document format suitable for sharing or printing.
- The user can export underlying data (e.g. historical incidents, simulation results, risk analysis) in a structured format (e.g. CSV/PDF).
- Exported reports include metadata: generation date/time, applied filters, and data source/time range, so recipients know exactly what they're looking at.
- Export actions are logged for traceability (who exported what, and when).

## US-15: View active emergencies on a simple map

**As...** a citizen,
**I want to...** see the active emergencies of any type on a simple map,
**So that...** I can quickly tell whether there is an emergency near my home, my family or my route, without relying on social media or unofficial sources.

**Acceptance Criteria:**

- The system shows all currently active incidents of any type, each with a distinct icon and a legend.
- Selecting an incident should shows its type, approximate location, current status and the time of the last update.
- The map shows when the data was last updated, and gives a clear warning if the data is stale or if the data source is unavalaible/unreachable.
- Only incidents validated by an operator are shown, and only information intended for the public; internal operational data is never exposed.
- The system should allow filtering of the incident type shown to the user