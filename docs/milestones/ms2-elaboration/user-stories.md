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
**I want...** to create, update and close incidents, and update the status of resources,\
**So that...** the platform reflects the real situation, including occurrences reported by phone or radio.

**Acceptance Criteria:**

- The system must allow the user to create an incident with location, type, severity and description.
- The system must allow the user to update the severity and status of an incident and to close it.
- The system must allow the user to assign resources to an incident and update their status.
- The system must record who made each change and when.

## US-4: Order logging

**As...** a control room operator,\
**I want...** to log the orders sent to field teams and their acknowledgement of receipt,\
**So that...** there is a reliable record of what was ordered, to whom and when.

**Acceptance Criteria:**

- The system must allow the user to log an order associated with an incident and a resource, with an automatic timestamp.
- The system must allow the user to mark an order as acknowledged, recording the time of acknowledgement.
- The system must display the order history of each incident in chronological order.

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
**I want...** to receive recommendations for allocating and routing resources, and to be able to accept, adjust or reject them,\
**So that...** I can respond faster without losing control over the final decision.

**Acceptance Criteria:**

- The system must suggest which resources to assign to an incident, with a short justification.
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

Planeador/Analista
13. Consultar dados históricos de incidentes filtrados por zona, período e tipo.
14. Ver num mapa as zonas e épocas de maior risco, com base no histórico.
15. Simular cenários antes de grandes eventos ou da época de incêndios, com o motor preditivo e dados sintéticos.
16. Exportar mapas, dados e relatórios que apoiem decisões de planeamento e pedidos de meios.

Cidadão
## US-17: View active emergencies on a simple map

**As...** a citizen,
**I want to...** see the active emergencies of any type on a simple map,
**So that...** I can quickly tell whether there is an emergency near my home, my family or my route, without relying on social media or unofficial sources.

**Acceptance Criteria**

- The map shows all currently active incidents, of any type (wildfires, traffic accidents, floods, structural incidents, etc.), each with a distinct icon and a legend. Closed incidents are not shown.
- Selecting an incident shows its type, approximate location, current status and the time of the last update.
- The map shows when the data was last updated. If the data is stale or the source is unavailable, the user sees a clear warning; the map never shows "no emergencies" when data is simply missing.
- Only incidents validated by an operator are shown, and only information intended for the public; internal operational data is never exposed.

Nota: isto pode ser de mais, as mais cortáveis são provavelmente 6, 11, 14 e 16, que 'são desejáveis mas não essenciais ao MVP'.
Além disso, em diagramas e afins, pode-se contabilizar os agentes no terreno e as fontes externas (e possivelmente o admin???) como atores secundários (ao contrário do resto que seriam atores primários)
