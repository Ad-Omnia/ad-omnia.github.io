---
date: 2026-10-07
order: 3
description: Functional and non-functional requirements
---

# Requirements

## Functional Requirements (FR)

### Data ingestion (ING)

- **FR-ING-1:** The system shall ingest data from multiple external sources through independent, pluggable connectors, converting it into a common internal data model.
- **FR-ING-2:** The system shall monitor the health and last successful update of each connector.
- **FR-ING-3:** The system shall detect changes in ingested incidents and emit them as events.

### Operational picture (COP)

- **FR-COP-1:** The system shall maintain a unified, real-time state of incidents and resources and push updates to clients without a manual refresh.
- **FR-COP-2:** The system shall provide a layered map that can be filtered by agency, resource type, incident type, data source, area and time window.

### Historical analysis (HIST)

- **FR-HIST-1:** The system shall support searching historical incidents by any combination of zone, date/time range and incident type, returning results within a reasonable time for the expected data volume; each result shall show the incident's own data (location, type, status, timestamps) together with all directly related information: linked entities (e.g. assigned resources, orders, alerts, logs) and other incidents that reference it (e.g. a follow-up or a duplicate/merged incident), each labeled with its relationship to the queried incident (e.g. "referenced by", "caused by", "merged into").
- **FR-HIST-2:** The system shall provide a map ranking zones and time periods by historical risk level, computed from past incident frequency, severity and type, filterable by time period, with a per-zone drill-down showing the underlying data (incident count, types, trend over time) and the date range and refresh time of that computation.
- **FR-HIST-3:** The system shall show an explicit "no results" state when a historical search matches no incidents, instead of an empty or ambiguous screen.

### Incident and resource management (INC)

- **FR-INC-1:** The system shall manage the incident lifecycle, including incidents created manually by the operator.
- **FR-INC-2:** The system shall manage the assignment and release of resources to incidents and the resource status lifecycle.
- **FR-INC-3:** The system shall manage orders sent to field teams, linked to an incident and a resource, tracking their acknowledgement and flagging those not acknowledged within a configurable period.

### Alerts (ALR)

- **FR-ALR-1:** The system shall generate alerts from change events and track their acknowledgement.

### Prediction (PRD)

- **FR-PRD-1:** The system shall generate progression forecasts for active incidents and high-risk areas for the coming hours, each with a confidence level, generation time and input data.
- **FR-PRD-2:** The system shall let the analyst configure and run a simulation through the predictive engine using parameters such as time window, zone(s), expected event type and synthetic/historical data inputs, producing a projected outcome (incident volume, severity distribution, resource demand) that is visually and explicitly marked as synthetic/predictive and has no effect on live operational data or active incident records.
- **FR-PRD-3:** The system shall support limit-scenario simulations in which simulated demand is scaled up until it saturates all available resources (personnel, vehicles, equipment, etc.), reporting the saturation point, the resource types that run out first, and the resulting gaps between demand and available capacity (e.g. unmet requests, response delays); results shall be marked as synthetic/predictive with no effect on live data.
- **FR-PRD-4:** The system shall generate occurrence risk levels per area for the current and following days, based on current and forecast environmental data, indicating the main contributing factors.
- **FR-PRD-5:** The system should allow simulations to be saved, re-run with adjusted parameters and compared against each other.

### Recommendation (REC)

- **FR-REC-1:** The system shall generate recommendations to assign or release resources, each with a justification.
- **FR-REC-2:** The system shall compute routes and estimated arrival times over the road network.
- **FR-REC-3:** The system shall apply a recommendation only after explicit operator confirmation, storing the decision and an optional reason.

### Audit (AUD)

- **FR-AUD-1:** The system shall record every change to incidents, resources, orders, recommendations and public warnings with its author and timestamp, consultable per incident and exportable.
- **FR-AUD-2:** The system shall log every export action, recording who exported what and when, for traceability.

### Export and reporting (EXP)

- **FR-EXP-1:** The system shall allow exporting the current map view, including active filters and layers, as an image or document, and exporting underlying data (e.g. historical incidents, simulation results, risk analysis) in a structured format (e.g. CSV, PDF); each export shall include the generation date/time, applied filters and data source/time range as metadata.

### Public publishing (PUB)

- **FR-PUB-1:** The system shall publish validated incidents and area warnings selected by the operator to the public application.
- **FR-PUB-2:** The system shall display in the public application a map of all active incidents validated by an operator, each with an icon distinct by incident type, and a legend.
- **FR-PUB-3:** The system shall show, when an incident is selected, its type, approximate location, current status and time of last update.
- **FR-PUB-4:** The system shall allow the citizen to filter the incidents shown by type.
- **FR-PUB-5:** The system shall show the time of the last update of the public data and display a clear warning when the data is outdated or the source is unavailable.
- **FR-PUB-6:** The system shall remove from the public application any incident that the operator hides or closes.
- **FR-PUB-7:** The public view shall exclude all operational data.
- **FR-PUB-8:** The system shall allow the operator to update or end an active public warning.

## Non-functional requirements

| ID | Attribute | Situation | Expected response | Measure |
| --- | --- | --- | --- | --- |
| NFR-PERF-1 | Performance | New data is received by the platform | It is shown on the map, as an alert or on the public app | Within 5 seconds |
| NFR-PERF-2 | Performance | A major incident with 500 incidents and 2500 resources on the map | The map remains usable | Interactions under 200 ms; filters applied under 1 s |
| NFR-AVL-1 | Availability | An external data source stops responding | Last known data stays visible and the source is flagged as outdated; other sources keep updating | Flag shown within 30 s; no other source affected |
| NFR-AVL-2 | Availability | The predictive or recommendation engine fails | The rest of the platform keeps working and the failure is shown to the operator | No impact on map, incidents, orders or alerts |
| NFR-AVL-3 | Availability | The control room loses internet access | The private app keeps working with the last data received and the local operations | Incident, order and audit functions fully usable offline |
| NFR-AVL-4 | Availability | The private application or the private-to-public link becomes unavailable | The public app keeps serving the last published state and shows that the data is outdated | Warning shown within 30 s; public app stays available |
| NFR-INT-1 | Integrity | Someone tries to edit or delete an audit, order or decision record | The operation is refused and any tampering is detectable | 0 records modified or removed |
| NFR-SEC-1 | Security | A station without a valid license tries to access the private application | Access is denied and the attempt is logged | 100% of attempts denied and logged |
| NFR-SEC-2 | Security | The public application is compromised | The attacker has no path to the private application or its data | Data flows only from private to public; no inbound connection to the private app |
| NFR-SEC-3 | Security | A citizen uses the public application | No personal data is collected or stored, and no internal-only field is exposed | 0 personal identifiers collected; 0 internal-only fields in public responses |
| NFR-SEC-4 | Security | An attacker obtains a copy of the private application's database | Stored licenses cannot be used to access the application | 0 licenses stored in plain text; licenses stored with a slow, salted hash |
| NFR-SCA-1 | Scalability | A crisis causes a traffic peak on the public app | The public app keeps serving incidents and warnings | 5000 concurrent users without degradation |
| NFR-USA-1 | Usability | An operator registers a phone-reported incident | The incident is created without assistance | Under 30 seconds |
| NFR-USA-2 | Usability | A citizen opens the public app on a smartphone | It is usable in the browser without installing anything | Responsive layout |

## Traceability

| User story | Requirements |
| --- | --- |
| US-1: Real-time operational map | FR-ING-1, FR-ING-2, FR-COP-1, NFR-PERF-1, NFR-PERF-2, NFR-AVL-1 |
| US-2: Map filtering and details | FR-ING-1, FR-COP-2, NFR-PERF-2 |
| US-3: Incident and resource management | FR-INC-1, FR-INC-2, FR-AUD-1, NFR-INT-1, NFR-USA-1, NFR-AVL-3 |
| US-4: Order tracking | FR-INC-3, FR-AUD-1, NFR-INT-1, NFR-AVL-3 |
| US-5: Incident alerts | FR-ING-3, FR-ALR-1, NFR-PERF-1 |
| US-6: Risk forecasting | FR-PRD-1, NFR-AVL-2 |
| US-7: Tactical recommendations | FR-REC-1, FR-REC-2, FR-REC-3, FR-INC-2, NFR-AVL-2 |
| US-8: Decision log | FR-REC-3, FR-AUD-1, NFR-INT-1 |
| US-9: Public communication | FR-PUB-1, FR-PUB-6, FR-PUB-8, NFR-PERF-1, NFR-SEC-2, NFR-SCA-1 |
| US-10: Historical incident search | FR-HIST-1, FR-HIST-3 |
| US-11: Historical risk map | FR-HIST-2 |
| US-12: Pre-event simulation | FR-PRD-2, FR-PRD-5, NFR-AVL-2 |
| US-13: Limit-scenario simulation | FR-PRD-3, NFR-AVL-2 |
| US-14: Export for planning and resource requests | FR-EXP-1, FR-AUD-2 |
| US-15: Public emergency map | FR-PUB-1, FR-PUB-2, FR-PUB-3, FR-PUB-4, FR-PUB-5, FR-PUB-6, FR-PUB-7, FR-ING-2, NFR-PERF-1, NFR-AVL-4, NFR-SEC-2, NFR-SEC-3, NFR-SCA-1, NFR-USA-2 |
| US-16: Occurrence risk forecasting | FR-ING-1, FR-PRD-4, NFR-AVL-2 |

NFR-SEC-1 and NFR-SEC-4 apply to all user stories of the private application.
