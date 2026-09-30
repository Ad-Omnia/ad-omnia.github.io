# Descrição do Projeto

## Context

In emergency situations and large-scale event management, Portuguese emergency and security agencies, such as Civil Protection, INEM, security forces, etc., operate using data scattered across multiple sources and proprietary systems (cartography, historical records, real-time feeds, ...) without a unified and up-to-date view of the situation.
This fragmentation hinders inter-agency coordination and delays decision-making in critical scenarios, where every minute counts.
This same lack of information can also impact citizens, who are left without essential information during a crisis.

## Problem

There are multiple data sources and no platform to aggregate, correlate, and present them in a unified interface, preventing centralized, predictive, and AI-supported management.

## Objectives

- Integrate diverse data into a single platform​
- Build a COP (Common Operational Picture) interface for decision support​
- Develop a predictive AI engine to anticipate risk scenarios​
- Automated recommendation for resource allocation, routing, etc.​

## Resultados esperados

- Unified data ingestion engine with built-in connectors for public data sources​
- Functional COP platform for spatio-temporal data visualization, featuring public and private access tiers​
- Trained Predictive AI model for risk scenario forecasting​
- Scalable, plugin-based architecture designed for future platform expansion​
- Tactical recommendation system providing automated suggestions for asset allocation and routing​

## Trabalho relacionado (rascunho)

| FEATURE | Palantir Gotham | Thales HexaForce | SADO | HxGN OnCall | Esri ArcGIS | Ours (Ad Omnia) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Native connectors for Portuguese public data (ANEPC, SNS, Fogos.pt) | ◯ | ◯ | ◑ | ◯ | ◑ | ⬤ |
| Predictive incident progression | ◑ | ◑ | ◯ | ◑ | ◑ | ⬤ |
| Interoperability between police, firefighters and EMS | ◑ | ◯ | ◑ | ⬤ | ◑ | ⬤ |
| Automatic resource allocation and routing recommendations | ◑ | ◑ | ◯ | ⬤ | ◑ | ⬤ |
| Plugin architecture for new modules and data sources | ◑ | ◑ | ◯ | ◑ | ⬤ | ⬤ |
| Dual-use architecture (civil and defense) | ⬤ | ◯ | ◯ | ◯ | ⬤ | ⬤ |

◯ - No
◑ - Does it in a limited capacity
⬤ - Yes
