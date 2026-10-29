---
date: 2026-10-18
order: 11
description: Licenses and terms of use of every external data source, usage restrictions and decisions
---

# Data source licenses

This document records the license and terms of use of every external data source considered by Ad Omnia, the restrictions that matter for our use, and the decision or alternative for each one.
The terms were read on 18 October 2026. They can change without notice, so each source should be re-checked before a release and before any change in how the platform is used or distributed.
This is a technical reading of public terms, not legal advice. Where the terms are silent or ambiguous, the entry says so and lists who to ask.

## Intended use

The conclusions below depend on how Ad Omnia is used today:

- **Proof of concept.** Academic project at the University of Aveiro, built on public data, real-time feeds and synthetic data. It is not sold and has no revenue.
- **Private application.** Runs on-premises in a control room. Internal operational support.
- **Public application.** Internet-facing. No advertising, no subscriptions, no donations. Shows only incidents validated by an operator.
- **Future.** If the project is offered to agencies as a product, most of the "non-commercial" conditions below stop applying and every source must be re-evaluated.

## Summary

## Summary

| Source | Used for | License / terms | Commercial use | AI Training / Storage | Personal Data (GDPR) | Proposed decision |
| --- | --- | --- | --- | --- | --- | --- |
| IPMA | Warnings, fire risk, seismic events, weather | Copyright, free use without profit-making purposes, attribution required | Not allowed as written | Yes (academic) | No | Use, with attribution; inform IPMA |
| OpenSky | Aerial assets (ADS-B) | Research, education, internal testing, government use | Contact OpenSky | Yes (academic) | Yes (ICAO24/Callsigns) | Use for the proof of concept |
| Fogos.pt | Real-time incidents | Authorized via specific token | Not allowed | Yes (academic) | Potentially (OSINT) | Authorized; token received |
| AISstream | Vessels (AIS) | API key, fair use, no SLA | Not stated | Not applicable (no history) | No | Defer; optional plugin |
| HERE | Routing | End User Terms (checked), platform terms not checked | Needs a separate agreement | Not applicable (routing) | No | Do not rely on it for the critical path |
| dados.gov.pt | Zone boundaries, historical records | CC BY 4.0 by default, per dataset | Allowed with attribution | Allowed | No (Check per dataset) | Use; record each dataset |
| Open-Meteo | Weather history and forecast for the AI | CC BY 4.0 data, free API non-commercial only | Paid plan required | Allowed (within limits) | No | Use for the proof of concept |
| GDACS | Global disaster events | Disclaimer, no explicit reuse license found | Not stated | Allowed | No | Defer |
| Map Tiles & Routing | Basemaps and routing | Various (Self-hosted, ODbL, Proprietary) | Depends on specific source | Allowed | No | Use (Self-hosted) |
| OurAirports | Airport reference data | Public Domain | Allowed | Allowed | No | Use freely |
| VOST Portugal / ANEPC feed | Official occurrences | Unknown | Unknown | Unknown | Unknown | Ask; do not integrate yet |

## Transversal Requirements

To comply with the project goals and legal requirements (such as GDPR), the following transversal aspects are applied to all external data sources:

**1. Data Storage and AI Training**
Ad Omnia stores historical data in a database and uses it to train predictive models (US-11, US-16). For the current academic and non-profit proof of concept, sources like Open-Meteo, dados.gov.pt, and OpenSky permit this storage and processing. Fogos.pt has also granted explicit authorization for our use case. 

**2. Personal Data and GDPR**
Most sources used do not provide personally identifiable information (PII). However, exceptions exist:
- **OpenSky:** Provides aircraft ICAO24 addresses and callsigns. While typically linked to companies, private aircraft data can border on personal data. 
- **Fogos.pt:** Relies partly on volunteer OSINT which could inadvertently include personal details in incident descriptions. 
Since Ad Omnia does not process this data to identify individuals, no specific GDPR consent mechanism is required for these public data points at this stage.

**3. Unified Attribution Table**
The frontend (COP and public application) must display the following attributions to comply with the respective terms of use:

| Source | Required Attribution Text / Logo | Display Location |
| --- | --- | --- |
| IPMA | IPMA logo with a hyperlink to the IPMA site | COP / Public App |
| Fogos.pt | "Source: Fogos.pt" | COP / Incident Details |
| OpenSky | "Source: The OpenSky Network" | COP (Assets) |
| Open-Meteo | "Weather data by Open-Meteo.com (CC BY 4.0)" | COP (Weather widgets) |
| Map Tiles | "Dados e mapas: Protomaps, © OpenStreetMap, © Mapterhorn, Imagery © Esri, OSRM, geoBoundaries" | COP / Public App (Map footer) |

---

## 1. IPMA

Instituto Português do Mar e da Atmosfera, public institute. Open-data API at `api.ipma.pt/open-data`. Feeds used by the IPMA plugin: weather warnings, fire risk forecast (RCM), seismic events, station observations, daily forecasts and daily climate files per municipality.

**Terms that matter**

- The content is protected by copyright and related rights, and cannot be used outside the conditions admitted on the site.
- Users may copy and use information free of charge, for personal or public use, as long as the use has no profit-making or offensive purposes.
- The source must always be cited. When IPMA information is included in a page, the IPMA logo must be used with a hyperlink to the IPMA site.
- IPMA asks users to email webmaster@ipma.pt to report their use of the service and its purpose.
- Attempts to alter information or put the integrity of the system at risk are forbidden.
- IPMA can change the site or its access without notice and gives no guarantee of continuity, accuracy or timeliness.
- No explicit open license (such as CC BY) was found for the open-data API.

**Impact on Ad Omnia**

- A non-profit academic proof of concept fits the "no profit-making purposes" condition, in both applications.
- The "no profit-making purposes" wording would block a commercial product.
- IPMA data shown to citizens needs the logo with link. The plugin manifest already carries the attribution text, so the COP and the public application can display it.
- The data is indicative and not guaranteed. Warnings must not be presented as Ad Omnia's own assessment.

**Decision and alternatives**

- Use IPMA for the proof of concept with attribution.
- Email webmaster@ipma.pt to report the use and to ask whether reuse in a future product is allowed. Record the answer here.
- Keep `commercial_use` and `public_display` as `None` in the manifest until IPMA answers.
- If IPMA becomes unusable: Open-Meteo for weather (see section 7), GDACS for global seismic events (see section 8). There is no open equivalent for Portuguese weather warnings or the RCM fire risk. If needed, fire risk can be computed in-house from weather data (FR-PRD-4).

---

## 2. OpenSky Network

ADS-B aircraft positions, used to show aerial assets as Assets in the private COP. Airport reference data comes from OurAirports (public domain), which is a separate source.

**Terms that matter**

- Use is limited to research and education without profit, internal commercial testing and evaluation, or government purposes.
- Any other commercial use requires contacting OpenSky.
- Publications must cite the OpenSky paper, and the attribution "Source: The OpenSky Network" should be shown.
- Rate limits (credits per day): 400 anonymous, 4000 with an account, 8000 with a receiver feeding the network. A box up to 25 square degrees costs 1 credit per call; the flights endpoint costs 30 credits per call.
- OAuth2 client credentials only. Basic auth no longer works.

**Impact on Ad Omnia**

- Fits the proof of concept. Does not fit a commercial product.
- Aircraft are not planned to appear in the public application, so public display is not needed now. The manifest keeps `public_display` as `None`.
- One region at 300 s fits the anonymous budget. With credentials the interval can go down to about 30 s.

**Decision and alternatives**

- Use OpenSky for the proof of concept, with an account for the 4000 credits per day.
- Decision recorded: if the project becomes a product, OpenSky must be replaced or licensed.
- Alternatives to evaluate: airplanes.live and adsb.fi (community ADS-B aggregators, also used by Fogos.pt for aerial tracking), and Flightradar24 (commercial, paid API). Their terms were not reviewed here.

---

## 3. Fogos.pt

Real-time wildfire occurrences, based on ANEPC records, operated by VOST Portugal. It is the only real-time incident source in the core set (US-1, US-5, US-15) and has its own plugin (Fogos.pt Incident Detail).

**Terms that matter**

- API access depends on a formal request through a form. Each request is reviewed on purpose of use, request volume, infrastructure impact and alignment with the project's goals.
- Requests must carry an individual token in a header, an identifiable and personalized User-Agent, and the origin IP whenever possible. Requests that do not comply may be limited or blocked.
- The public page names the header `X-API-Key`. Earlier notes mention `FOGOS-PT-AUTH`. Confirm the exact header when the token arrives.
- The terms recorded by the team allow academic use and non-commercial use by organizations, including internal operational support tools, thus it forbids advertising, donations, paid services, and selling the product to third parties.
- The same terms forbid advertising, donations, paid services, products sold to third parties, and solutions whose value depends on making the API data available.
- Visible attribution ("Source: Fogos.pt") is required. The API must not be the only or decisive source in civil protection contexts.
- The data is built from several sources (ANEPC, ICNF, AGIF, Copernicus, NASA, Meteosat, Mapbox, Waze and volunteer OSINT). Aerial tracking uses Flightradar24, airplanes.live and adsb.fi. Location is approximate and positions can be delayed.
- Strict rate limits apply for authenticated users: maximum 300 requests per 60 seconds (window).

**Impact on Ad Omnia**

- The private application fits the terms.
- The public application is a gray zone, because it republishes incidents to citizens. What helps is that an operator validates each incident before it is published (US-9), so Ad Omnia is not mirroring the feed.
- If the project is sold to agencies, it no longer fits the terms.
- Components of the data (for example Flightradar24 and Waze) may carry their own conditions. Ask VOST Portugal.
- Without the token, issue #43 ("at least one real source") stays blocked.
- We have requested and recently received authorization (token) from VOST Portugal for this academic project.
- The platform must respect the 300 requests/60s limit.

**Decision and alternatives**

- Request the token now, describing both applications in the form, including the operator validation step and the absence of ads, subscriptions and donations. Ask explicitly about public republication.
- Keep the mock connector as the fallback for development.
- Alternatives: fogos.icnf.pt, and the VOST API source code, which is public (see section 9). NASA FIRMS can complement it with satellite detections (see "Other sources").
- **UPDATE**:  Authorized. The API will be actively used in the project using the granted token. 

---

## 4. AISstream

Real-time maritime traffic (AIS) through a WebSocket at `wss://stream.aisstream.io/v0/stream`.

**Terms and technical conditions**

- Free tier with an API key (created through a GitHub account). Keep the key on the server.
- Direct browser connections are not permitted. The backend must act as a proxy and pass on only what clients need.
- Bounding boxes are mandatory. Optional filters: up to 200 MMSIs and message types.
- Limits: 3 subscribed connections per account, 3 open connections per IP, first subscription within 3 seconds, one subscription update per second.
- The stream must be read continuously, otherwise messages are dropped. Since September 2026, uncompressed connections are subject to per-user bandwidth limits, so `permessage-deflate` is needed.
- No SLA and no history. No open commercial license is stated. Use falls under fair use for prototyping, research and development.

**Impact on Ad Omnia**

- No user story depends on vessels today, and ships are not linked to agencies. A permanent WebSocket worker adds infrastructure for little benefit in the first phase.
- It would become relevant if the scope covers the coast, maritime accidents or search and rescue.

**Decision and alternatives**

- Defer. Keep it as an optional plugin until a user story justifies it.
- If it is built: the plugin must connect from the backend with compression, and the public application must never talk to AISstream directly.
- No alternative is needed while it stays optional.

---

## 5. HERE

Routing over the road network, to compute the routes and arrival times of recommendations (FR-REC-2, US-7).

**What was reviewed.** The HERE End User Terms (effective 4 May 2021). The developer platform terms, the Acceptable Use Policy and the plan limits and prices were **not** reviewed and must be read before any decision.

**Terms that matter**

- The license is non-exclusive, non-transferable, non-sublicensable, revocable and limited, for own use or use within the company.
- HERE may modify, limit or discontinue its products at any time, including starting to charge for features that were free.
- HERE may suspend or terminate with three months' notice, or immediately for breach, or after six months without use.
- Total liability is capped at 50 euros.
- HERE products are not intended for situations where precise data is needed or where inaccurate data may lead to death or injury.
- A separate signed agreement prevails over these terms.

**Impact on Ad Omnia**

- The "not for situations where inaccurate data may lead to death or injury" clause conflicts directly with emergency routing, even though the operator always decides.
- The private application must keep working with limited internet (NFR-AVL-3), which does not match a cloud routing API.
- Free-tier limits and caching rules are unknown until the platform terms are read.

**Decision and alternatives**

- Do not make HERE the only routing option. Read the platform terms and the Acceptable Use Policy before any use.
- Preferred direction, to be evaluated: self-hosted routing over OpenStreetMap data (for example OSRM or Valhalla). It runs on-premises, has no per-call limits and no third-party liability clause. OpenStreetMap data is under the ODbL license, which requires attribution and has share-alike conditions that must be checked.
- If HERE is still wanted, contact HERE for a separate agreement.

---

## 6. dados.gov.pt

National open data portal of the Portuguese public administration, run by ARTE, I.P. It is a catalog: each dataset has its own provider and license. Planned uses: zone boundaries (CAOP) for Zone, and historical occurrences for Risk Rating (US-11).

**Terms that matter** (terms updated 29 September 2026)

- Using the portal and reading or downloading data is free and needs no registration.
- Datasets published by state bodies are under CC BY 4.0, unless stated otherwise. Other participants can choose other open licenses offered by the platform. Resources follow the license of their dataset.
- Datasets must not contain personal data, except with consent or a legal basis. Reusers must follow data protection law and the dataset license.
- Datasets that include intellectual property rights that may block reuse must say so in their documentation.
- The API is open and free. An API key (`X-API-KEY` header) is needed only for write operations.
- ARTE aims for 99.5% monthly availability, and can change or suspend the portal without notice and without compensation.

**Impact on Ad Omnia**

- CC BY 4.0 allows commercial use with attribution, so this is the least restrictive source in the list.
- The license is not portal-wide. Every dataset must be checked individually before import.

**Decision and alternatives**

- Use it for one-off imports. For each dataset, record provider, license, URL, date of access and attribution text.
- Before import, check in particular CAOP and any ICNF or ANEPC historical occurrences.
- Check that historical occurrence data contains no personal data.

| Dataset | Provider | License | Attribution | Checked on |
| --- | --- | --- | --- | --- |
| CAOP (boundaries) | to confirm | to confirm | to confirm | pending |
| Historical occurrences | to confirm | to confirm | to confirm | pending |

---

## 7. Open-Meteo

Hourly weather history and forecast (wind, humidity, temperature, precipitation) to train and feed the predictive models (US-6, US-16). IPMA's open data only has daily classes and 20-day windows.

**Terms that matter**

- The weather data is under CC BY 4.0, which requires credit to Open-Meteo and indication of changes. Commercial use of the data is allowed by that license.
- The free API is for non-commercial use only. Limits: 600 calls per minute, 5,000 per hour, 10,000 per day and 300,000 per month, with no uptime guarantee.
- Non-commercial use includes non-profit websites or apps without subscriptions or advertising, public research at public institutions, educational content, and voluntary donations.
- Commercial use includes apps with subscriptions or ads, commercial products, and undisclosed research at commercial entities.
- Rate limits apply per IP and application, and Open-Meteo can block misuse without notice.
- Paid plans (Standard 1M calls per month, Professional 5M, Enterprise 50M and above) grant a commercial license and a dedicated endpoint. Historical, climate, ensemble and satellite radiation APIs need the Professional plan or higher on the paid endpoint.
- The server code is open source (AGPLv3), so self-hosting is possible.
- Governing law is Swiss law.

**Impact on Ad Omnia**

- Fits the proof of concept: academic, no ads, no subscriptions. The 10,000 calls per day limit is enough if calls are cached and batched.
- A commercial product would need the Professional plan (for history) or self-hosting.

**Decision and alternatives**

- Use the free API for the proof of concept, with caching, and show "Weather data by Open-Meteo.com (CC BY 4.0)" wherever the data or derived results are shown.
- Alternatives: IPMA for current Portuguese conditions (section 1), or self-hosting Open-Meteo if volume or commercial use requires it.

---

## 8. GDACS

Global Disaster Alert and Coordination System (UN and European Commission). Considered as a second source for seismic events and as a demonstration plugin.

**Terms that matter**

- Earthquake, tsunami and tropical cyclone notifications are automatic and not reviewed by humans before being issued. They can contain errors.
- Data is provided "as is". There is no guarantee of completeness or timeliness, and the system can go down or change without notice.
- GDACS is not meant to replace or override official alerts from national authorities. Its notifications should not be used for decisions without prior confirmation.
- The stakeholders accept no liability for damage, injury or loss of life resulting from use of the content.
- GDACS information is openly accessible and can be integrated into other portals through RSS feeds or other standard formats.
- The pages reviewed contain a disclaimer but no explicit reuse license. Confirm with GDACS or the JRC before relying on it.

**Impact on Ad Omnia**

- It duplicates IPMA seismic data and rarely has events in Portugal.
- Its own terms say it must be confirmed before decisions. That fits Ad Omnia only if the data is shown as unverified.

**Decision and alternatives**

- Defer. It can be a good demonstration plugin of the connector contract.
- If added, label its data as automatic and unverified, and never publish it to the public application without operator validation.

---

## 9. Map Tiles and Routing (Self-hosted)

The COP and public application require cartography and routing. To ensure the system works offline (NFR-AVL-3), tiles and routing engines are self-hosted.

**Terms that matter**
- **OpenStreetMap (OSM):** Data is licensed under the Open Database License (ODbL). It requires attribution and has share-alike conditions if the database is adapted.
- **Other providers (Protomaps, Mapterhorn, Esri, OSRM, geoBoundaries):** Various open and proprietary licenses apply to the specific imagery and boundary datasets used. 

**Decision:**
- Use the self-hosted solution.
- The frontend must display the exact attribution: "Dados e mapas: Protomaps, © OpenStreetMap, © Mapterhorn, Imagery © Esri, OSRM, geoBoundaries".

---

## 10. OurAirports

Airport reference data used by the OpenSky plugin to match flights to airports.

**Terms that matter**
- The data is explicitly placed in the Public Domain.
- No restrictive terms for commercial use, storage, or redistribution.

**Decision:**
- Use freely. No specific attribution is legally required, though good practice dictates mentioning it in project documentation.

---

## 11. VOST Portugal and the ANEPC occurrences feed

Fogos.pt is operated by VOST Portugal, which integrates ANEPC data under a cooperation protocol. The VOST API has public source code, and the occurrence data comes from ANEPC (via emergencias.pt). The idea is to run that code on a machine of our own and call it, which would give occurrences and emergencies beyond wildfires.

**What is known**

- The source code is public, but the license of the code and the terms of the underlying ANEPC data are **not known**.
- Running the code ourselves would not remove the terms of the upstream data, and the ANEPC occurrence feed may not be meant for redistribution.
- Fogos.pt data can be a derived work with third-party components (see section 3).

**Decision and alternatives**

- Do not integrate yet.
- If access is possible, ask VOST Portugal (mail@fogos.pt, or the token form) which data can be reused, whether the code can be self-hosted, and whether the data can be shown in the public application.
- Also ask ANEPC directly, through the project advisors, whether an official feed exists for research use.
- If neither answers, the proof of concept continues with Fogos.pt, the mock connector and synthetic data for the remaining incident types.

---

## Other sources

These were analyzed but are not in the core set. They are listed so that every source has its status recorded.

| Source | Terms found | Decision |
| --- | --- | --- |
| NASA FIRMS | Open sharing of data, with citation rules for redistribution. Needs a free `MAP_KEY`, limited to 5,000 transactions per 10 minutes. Suomi NPP deliveries end on 2 November 2026, so use NOAA-20 and NOAA-21. Latency is up to 3 hours (NRT), 30 minutes (RT) and 5 minutes (URT). The restrictions section of the FAQ was not visible in the copy reviewed. | Defer. Possible second wildfire source through Incident Source, and training data. Coverage outside the Americas needs checking. |
| CelesTrak | No redistribution terms stated. | Discard. |
| OpenAQ | License depends on the original source, with attribution when applicable. | Discard. No user story uses air quality. |
| ENTSO-E, JRC REMON, EMEL, Aveiro Living Lab | Not checked, out of scope. EMEL covers only Lisbon. | Discard. |

## Open actions

| Action | Source | Owner | Status |
| --- | --- | --- | --- |
| Request the API token, describing both applications | Fogos.pt | to assign | open |
| Confirm the authentication header (`X-API-Key` or `FOGOS-PT-AUTH`) | Fogos.pt | to assign | open |
| Email webmaster@ipma.pt about use and future reuse | IPMA | to assign | open |
| Create an OpenSky account for the 4000 credits per day | OpenSky | to assign | open |
| Read the HERE platform terms and Acceptable Use Policy, and evaluate self-hosted routing | HERE | to assign | open |
| Record the license of each dataset before import | dados.gov.pt | to assign | open |
| Ask VOST Portugal and ANEPC about reuse of the occurrences feed | VOST / ANEPC | to assign | open |
| Fill `commercial_use`, `public_display` and attribution in each plugin manifest as answers arrive | All plugins | to assign | open |