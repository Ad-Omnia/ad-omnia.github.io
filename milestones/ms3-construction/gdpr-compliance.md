---
title: GDPR compliance analysis
date: 2026-10-29
order: 10
description: How Ad Omnia handles personal data, the laws that apply and what each agency needs before going live
---

# GDPR compliance analysis

<p class="ad-lede">Ad Omnia brings together emergency data from Civil Protection, INEM and the security forces into one operational picture. Most of that data is about places, vehicles and events, but some of it is about people: the operators who use the platform, the crews of the vehicles on the map and, above all, the citizens involved in an incident. This report explains which personal data the platform processes, which laws govern it, how the platform is designed to comply, and what an agency must put in place before using it with real data.</p>

<div class="ad-meta" markdown="1">
<span>**Scope:** private app (control room), public app (citizens), AI engine, plugins</span>
<span>**Based on:** [requirements](../ms2-elaboration/requirements.md), [data model](../ms2-elaboration/data-model.md), [architecture](../ms2-elaboration/architecture.md)</span>
<span>**Version:** 29/10/2026</span>
</div>

## At a glance { #at-a-glance }

<div class="ad-glance" markdown="1">

<div class="ad-tile is-ok" markdown="1">
<span class="ad-pill is-ok">Built in</span>

**Public app shows only what is not confidential**

Citizens use it without an account and see only validated incidents: type, status and approximate location. Casualties, police incidents and other confidential details never reach it (<span class="ad-id">NFR-SEC-3</span>, <span class="ad-id">FR-PUB-3</span>, <span class="ad-id">FR-PUB-7</span>). [Art. 5(1)(c) GDPR][gdpr-5]{ .ad-cite }
</div>

<div class="ad-tile is-ok" markdown="1">
<span class="ad-pill is-ok">Built in</span>

**A human decides, not the AI**

Recommendations are applied only after explicit operator confirmation (<span class="ad-id">FR-REC-3</span>), so no decision is based *solely* on automated processing. [Art. 22 GDPR][gdpr-22]{ .ad-cite }
</div>

<div class="ad-tile is-warn" markdown="1">
<span class="ad-pill is-warn">Before go-live</span>

**Offence data and exact locations in real feeds**

Victim information from INEM arrives anonymised, but police feeds can include offence data and an exact incident address can identify people. A DPIA is mandatory before going live. [Art. 10][gdpr-10]{ .ad-cite } [Art. 35 GDPR][gdpr-35]{ .ad-cite }
</div>

<div class="ad-tile is-warn" markdown="1">
<span class="ad-pill is-warn">Before go-live</span>

**Immutable audit log vs. right to erasure**

Resolved by the legal-obligation exception, as long as the log stores IDs and not personal details. [Art. 17(3)(b) GDPR][gdpr-17]{ .ad-cite }
</div>

<div class="ad-tile is-warn" markdown="1">
<span class="ad-pill is-warn">Before go-live</span>

**Dispatch AI is "high-risk" under the AI Act**

Resource dispatch recommendations fall under Annex III, point 5(d). Obligations apply from 2 December 2027. [Annex III AI Act][aia-annex3]{ .ad-cite }
</div>

<div class="ad-tile is-ok" markdown="1">
<span class="ad-pill is-ok">Built in</span>

**Operational data stays in the control room**

The private app runs on-premises, and data only flows out to the public app, never in (<span class="ad-id">NFR-SEC-2</span>). Confidential source data stays inside the plugin that brings it in and is reached only through the plugin architecture. No transfer outside the EU is needed. [Art. 25 GDPR][gdpr-25]{ .ad-cite } [Art. 44 GDPR][gdpr-45]{ .ad-cite }
</div>

</div>

??? info "How to read this report"

    - **Status labels** show where each topic stands: <span class="ad-pill is-ok">Built in</span> the platform's design already complies; <span class="ad-pill is-warn">Before go-live</span> must be in place before the platform processes real personal data, by the agency, by Ad Omnia as supplier, or both (see the [checklist](#go-live)); <span class="ad-pill is-na">Not applicable</span> the rule does not apply, with the reason.
    - **Citations** like [Art. 5 GDPR][gdpr-5]{ .ad-cite } open the legal text in a new tab. GDPR articles link to an article-by-article reader; the official texts are listed in [References](#references).
    - **Requirement codes** such as <span class="ad-id">FR-REC-3</span> or <span class="ad-id">NFR-SEC-2</span> refer to the platform's [requirements](../ms2-elaboration/requirements.md), so every claim can be traced to the design.
    - This report is a technical analysis, not legal advice. Each agency should validate it with its own Data Protection Officer before deployment.

## 1. The legal framework { #legal-framework }

Data protection is a fundamental right in the EU [Art. 8 Charter][charter]{ .ad-cite } [Art. 16(1) TFEU][tfeu]{ .ad-cite } and in Portugal [Art. 35 CRP][crp]{ .ad-cite }. These are the instruments that apply to Ad Omnia, from most to least central:

<div class="ad-law-grid" markdown="1">

<div class="ad-law" markdown="1">
<span class="ad-law-tag">EU regulation · core</span>

**[GDPR — Regulation (EU) 2016/679][gdpr]**

Applies directly in every Member State since 25 May 2018, without transposition. Governs all personal data processed by the private app and the public app.
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">PT law · core</span>

**[Lei n.º 58/2019][lei58]**

Executes the GDPR in Portugal: names the CNPD as supervisory authority and fills the GDPR's open clauses (DPOs in public bodies, retention, employment, health data, research, fines on public entities).
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">EU directive + PT law · police data</span>

**[Directive (EU) 2016/680][led] · [Lei n.º 59/2019][lei59]**

The GDPR does not cover processing by competent authorities to prevent, investigate or prosecute crime [Art. 2(2)(d) GDPR][gdpr-2]{ .ad-cite }. If PSP/GNR use the platform for those purposes, this regime applies instead.
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">EU regulation · AI</span>

**[AI Act — Regulation (EU) 2024/1689][aia]**

Classifies AI used to dispatch or prioritise police, firefighters and medical aid as high-risk. Amended by the Digital Omnibus, [Regulation (EU) 2026/1744][omnibus], which moved the Annex III deadline to 2 December 2027.
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">EU directive + PT law · security</span>

**[NIS2 — Directive (EU) 2022/2555][nis2] · [Decreto-Lei n.º 125/2025][dl125]**

Cybersecurity regime for essential and important entities, including public administration. Agencies running the platform must notify significant incidents within 24 hours, alongside any GDPR breach notification.
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">EU directive + PT law · websites</span>

**[ePrivacy Directive 2002/58/EC][eprivacy] · [Lei n.º 41/2004][lei41]**

Storing or reading anything on a visitor's device (cookies, localStorage) needs consent unless it is strictly necessary for a service the visitor asked for [Art. 5(3) ePrivacy][eprivacy]{ .ad-cite } [Art. 5 Lei 41/2004][lei41]{ .ad-cite }.
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">PT law · sector</span>

**[Lei n.º 27/2006 — Lei de Bases da Proteção Civil][lei27]**

Defines civil protection as a public task. This is the national law that gives agencies their lawful basis for processing operational data [Art. 6(1)(e) and 6(3) GDPR][gdpr-6]{ .ad-cite }.
</div>

<div class="ad-law" markdown="1">
<span class="ad-law-tag">CNPD regulation · DPIA list</span>

**[CNPD Regulamento n.º 798/2018][cnpd798]**

The Portuguese list of processing operations that always require a DPIA [Art. 35(4) GDPR][gdpr-35]{ .ad-cite }. Several items match Ad Omnia (see [§ 8](#dpia)).
</div>

</div>

## 2. Who is responsible? { #roles }

The GDPR assigns obligations by role. The **controller** decides why and how data is processed [Art. 4(7) GDPR][gdpr-4]{ .ad-cite }; a **processor** processes it on the controller's behalf [Art. 4(8) GDPR][gdpr-4]{ .ad-cite }, under a written contract [Art. 28 GDPR][gdpr-28]{ .ad-cite } [EDPB Guidelines 07/2020][edpb-roles]{ .ad-cite }. In a deployment, the roles are:

| Who | Role | Why |
| --- | --- | --- |
| Each agency (ANEPC, INEM, PSP, GNR, municipal civil protection) | **Controller** of the data it brings in and the actions of its control room | It decides the purposes (emergency response) under its own legal mandate. The private app is installed on-premises in each control room. |
| Agencies sharing one operational picture | Possibly **joint controllers** | If they jointly decide what is shared and how, they need an arrangement setting out who answers data subjects [Art. 26 GDPR][gdpr-26]{ .ad-cite }. |
| Ad Omnia (as supplier) | **Processor**, only when it supports, maintains or hosts | It acts on documented instructions and needs an Art. 28 contract covering confidentiality, security, sub-processors, deletion at the end of the contract and audits [Art. 28(3) GDPR][gdpr-28]{ .ad-cite }. |
| Plugin and data-source providers | Independent controllers of their own sources; processors only if they process agency data | A public API such as Fogos.pt is a source, not a processor. A hosted plugin that receives agency data would be a sub-processor. |
| PSP/GNR acting for crime prevention or investigation | Competent authorities under [Lei n.º 59/2019][lei59] | That processing falls outside the GDPR [Art. 2(2)(d) GDPR][gdpr-2]{ .ad-cite }; access to it must stay separated from the GDPR-governed operational data. |

!!! note "The current proof of concept"
    The 2026/27 proof of concept currently runs on public open data (such as Fogos.pt), synthetic data from the simulation module and test records. It can also work with real operational data, for example in a pilot with an agency or with a dataset an agency provides. When it does, the roles above apply and the agency and Ad Omnia agree in writing who is controller and who is processor before any data is shared [Arts. 26 and 28 GDPR][gdpr-28]{ .ad-cite }.

## 3. What personal data does Ad Omnia touch? { #data-map }

Personal data is any information about an identified or *identifiable* person, directly or indirectly, including location data and online identifiers [Art. 4(1) GDPR][gdpr-4]{ .ad-cite }. That is broader than it looks: a station ID that can be matched to the operator on shift, an incident address or a vehicle position can all identify someone. Data that is truly anonymous is outside the GDPR [Recital 26 GDPR][gdpr-r26]{ .ad-cite }.

<div class="ad-legend" markdown="1">
<span class="ad-pill is-gap">Art. 10</span> offence data [Art. 10][gdpr-10]{ .ad-cite }
<span class="ad-pill is-warn">Personal</span> identifies or can identify someone
<span class="ad-pill is-ok">Not personal</span> aggregated, synthetic or about objects
</div>

| Data and where it lives | Type | Whose data | Why it is processed |
| --- | --- | --- | --- |
| Station name and license hash<br><span class="ad-where">`users`</span> | <span class="ad-pill is-warn">Personal</span> | Control-room operators (indirectly: a station plus the shift roster identifies a person) | Access control (<span class="ad-id">NFR-SEC-1</span>) and accountability (<span class="ad-id">US-3</span>, <span class="ad-id">US-8</span>) |
| Who did what, and when<br><span class="ad-where">`audit_log` and the `*_by` / `decision_reason` columns</span> | <span class="ad-pill is-warn">Personal</span> | Operators | Traceability of operational decisions (<span class="ad-id">FR-AUD-1</span>, <span class="ad-id">FR-AUD-2</span>, <span class="ad-id">FR-REC-3</span>) |
| Incident description, location and source fields<br><span class="ad-where">`incident` (description, location, source fields), `observation`</span> | <span class="ad-pill is-warn">Personal</span> possible | Callers, residents of the address; victims only through anonymised INEM data | The operational picture itself (<span class="ad-id">US-1</span>, <span class="ad-id">US-3</span>). Victim information comes from the INEM API already anonymised, so it is not personal data for Ad Omnia [Recital 26 GDPR][gdpr-r26]{ .ad-cite }. An exact address can still point to a person, so locations are treated as personal data |
| Order content<br><span class="ad-where">`orders.content`</span> | <span class="ad-pill is-warn">Personal</span> possible | People named in the instruction | Instructions to field teams (<span class="ad-id">FR-INC-3</span>) |
| Offence-related information<br><span class="ad-where">Police feed plugins: the plugin's own database, private app only</span> | <span class="ad-pill is-gap">Art. 10</span> possible | Suspects, victims | Situational awareness; only under official authority [Art. 10 GDPR][gdpr-10]{ .ad-cite } |
| Vehicle callsign and position<br><span class="ad-where">`asset` (callsign, last position), `observation`</span> | <span class="ad-pill is-warn">Personal</span> | Crews of the vehicle (employees) | Showing available resources (<span class="ad-id">US-1</span>, <span class="ad-id">US-7</span>) |
| Aircraft tracks<br><span class="ad-where">ADS-B plugin (ICAO address, position)</span> | <span class="ad-pill is-warn">Personal</span> possible | Owners/pilots of non-agency aircraft | Tracking aerial assets |
| Predictions, risk ratings, simulation results<br><span class="ad-where">`prediction`, `risk_rating`, `simulation_*`</span> | <span class="ad-pill is-ok">Not personal</span> | — | Aggregated or synthetic by design (<span class="ad-id">FR-PRD-2</span>, <span class="ad-id">FR-PRD-3</span>) |
| Public incidents and warnings<br><span class="ad-where">Public app</span> | <span class="ad-pill is-ok">Not personal</span> | — | Approximate location, type and status only; no casualties, police incidents or other confidential information (<span class="ad-id">FR-PUB-3</span>, <span class="ad-id">FR-PUB-7</span>) |
| Visitor IP addresses<br><span class="ad-where">Reverse-proxy logs of the public app</span> | <span class="ad-pill is-warn">Personal</span> | Citizens | Security and abuse prevention. Dynamic IPs are personal data [CJEU C-582/14 Breyer][breyer]{ .ad-cite } [Recital 30 GDPR][gdpr-r30]{ .ad-cite } |
| AI training data<br><span class="ad-where">Historical incidents and observations</span> | <span class="ad-pill is-warn">Personal</span> unless anonymised | Everyone above | Training the predictive engine (<span class="ad-id">US-6</span>, <span class="ad-id">US-16</span>) |

!!! tip "The single biggest lever: keep free text out of the core"
    Almost every risk of identifying someone enters through three free-text or JSON fields: `incident.description`, `orders.content` and the `source_specific_*` columns. Connector plugins should map source data to structured, non-identifying fields (type, severity, location, counts) and drop names, phone numbers and clinical notes at ingestion. This is data minimisation applied at the boundary [Art. 5(1)(c) GDPR][gdpr-5]{ .ad-cite } and data protection by design [Art. 25(1) GDPR][gdpr-25]{ .ad-cite }.

!!! note "Confidential data stays inside plugins"
    Every external source, including INEM and police feeds, connects through a sandboxed plugin. Detailed or confidential data from a source (casualties, police incidents, source-specific fields) is kept in the plugin's own database and can only be reached through the Plugin Validation Broker, from the private app. The core and the public app receive only what the plugin exposes for the shared picture, and the public app only what is not confidential. This keeps each kind of sensitive data with the plugin, and the agency, responsible for it [Art. 25 GDPR][gdpr-25]{ .ad-cite } [Art. 5(1)(c) GDPR][gdpr-5]{ .ad-cite }.

## 4. The seven principles { #principles }

Every processing operation has to respect the principles of [Art. 5 GDPR][gdpr-5]{ .ad-cite }, and the controller must be able to *demonstrate* it [Art. 5(2) GDPR][gdpr-5]{ .ad-cite }.

| Principle | What it asks | How Ad Omnia complies | Status |
| --- | --- | --- | --- |
| **Lawfulness, fairness, transparency** [5(1)(a)][gdpr-5]{ .ad-cite } | A legal basis, and people are told what happens to their data | Legal bases mapped in [§ 5](#lawful-basis). Each agency must publish a privacy notice for the public app and inform its operators | <span class="ad-pill is-warn">Before go-live</span> |
| **Purpose limitation** [5(1)(b)][gdpr-5]{ .ad-cite } | Collected for explicit purposes, not reused for incompatible ones | Each entity in the data model records its rationale (user story). Simulations never write to live tables (<span class="ad-id">FR-PRD-2</span>). Reusing operational data to train AI is a further purpose: needs the compatibility test of [Art. 6(4)][gdpr-6]{ .ad-cite } or the research route of [Art. 89][gdpr-89]{ .ad-cite } | <span class="ad-pill is-warn">Before go-live</span> |
| **Data minimisation** [5(1)(c)][gdpr-5]{ .ad-cite } | Only what is needed | Public app: zero personal identifiers (<span class="ad-id">NFR-SEC-3</span>), approximate location (<span class="ad-id">FR-PUB-3</span>), no operational fields (<span class="ad-id">FR-PUB-7</span>). Confidential source data stays in plugins and is reached only through the plugin architecture. Stations, not individuals, hold licenses. Free-text fields are filtered at ingestion ([§ 3](#data-map)) | <span class="ad-pill is-ok">Built in</span> |
| **Accuracy** [5(1)(d)][gdpr-5]{ .ad-cite } | Correct and up to date | Per-source trust level and staleness threshold; outdated sources are flagged (<span class="ad-id">FR-ING-2</span>, <span class="ad-id">NFR-AVL-1</span>); duplicates are merged, not lost (Incident Relation) | <span class="ad-pill is-ok">Built in</span> |
| **Storage limitation** [5(1)(e)][gdpr-5]{ .ad-cite } | Kept no longer than needed | No retention period is defined yet for incidents, observations, orders or logs. In Portugal the period is the one set by law, otherwise what the purpose requires, then data must be destroyed or anonymised [Art. 21 Lei 58/2019][lei58]{ .ad-cite } | <span class="ad-pill is-warn">Before go-live</span> |
| **Integrity and confidentiality** [5(1)(f)][gdpr-5]{ .ad-cite } | Protected against unauthorised access, loss and damage | One-way private→public flow (<span class="ad-id">NFR-SEC-2</span>), licenses stored with slow salted hashes (<span class="ad-id">NFR-SEC-4</span>), tamper-evident records (<span class="ad-id">NFR-INT-1</span>), sandboxed plugins on an internal-only network. Details in [§ 7](#security) | <span class="ad-pill is-ok">Built in</span> |
| **Accountability** [5(2)][gdpr-5]{ .ad-cite } | Prove all of the above | Immutable audit log of every change and export (<span class="ad-id">FR-AUD-1</span>, <span class="ad-id">FR-AUD-2</span>); this report; a draft record of processing ([§ 8](#records)) | <span class="ad-pill is-ok">Built in</span> |

## 5. Lawful basis { #lawful-basis }

Processing is lawful only if one of six bases applies [Art. 6(1) GDPR][gdpr-6]{ .ad-cite }. Consent is the wrong tool here: a person in an emergency cannot give free consent, and public authorities cannot rely on legitimate interests when performing their tasks [Art. 6(1), last subparagraph][gdpr-6]{ .ad-cite }. Instead:

<div class="ad-steps" markdown="1">

1. **Operational data in the private app: public task.** Agencies process incident and resource data to perform a task in the public interest laid down by national law [Art. 6(1)(e) and 6(3) GDPR][gdpr-6]{ .ad-cite }, e.g. civil protection under [Lei n.º 27/2006][lei27]{ .ad-cite }. Where someone's life is at stake, vital interests also apply [Art. 6(1)(d) GDPR][gdpr-6]{ .ad-cite }; the GDPR itself mentions natural and man-made disasters as an example [Recital 46 GDPR][gdpr-r46]{ .ad-cite }.
2. **Health data (INEM): anonymised at source.** INEM's API provides victim information already anonymised, so it reaches Ad Omnia as non-personal data and Art. 9 does not apply [Recital 26 GDPR][gdpr-r26]{ .ad-cite }. If a feed ever carried identifiable health data, it would be prohibited by default [Art. 9(1) GDPR][gdpr-9]{ .ad-cite } and would need one of the exceptions: vital interests of a person unable to consent [9(2)(c)][gdpr-9]{ .ad-cite }, emergency medical care under professional secrecy [9(2)(h) and 9(3)][gdpr-9]{ .ad-cite } or public health [9(2)(i)][gdpr-9]{ .ad-cite }, with need-to-know access by bound professionals and access logs [Art. 29 Lei 58/2019][lei58]{ .ad-cite }.
3. **Offence data (police feeds): only under official authority.** Data relating to criminal offences may be processed only under the control of official authority or when authorised by law [Art. 10 GDPR][gdpr-10]{ .ad-cite }. Investigative use goes through [Lei n.º 59/2019][lei59]{ .ad-cite }.
4. **Operators and crews: employment context.** Data about staff is processed within labour law [Art. 28 Lei 58/2019][lei58]{ .ad-cite }. Vehicle positions show where resources are; they must not be used to evaluate crews, or the processing becomes employee location tracking that requires a DPIA ([CNPD list, item 3][cnpd798]{ .ad-cite }).
5. **Public app logs: public task, narrowly.** Short-lived IP logs to keep the service secure are part of running the public information service [Art. 6(1)(e) GDPR][gdpr-6]{ .ad-cite }.
6. **AI training: further processing with safeguards.** Use synthetic data first; then pseudonymised historical data with the safeguards of [Art. 89(1) GDPR][gdpr-89]{ .ad-cite } and [Art. 31 Lei 58/2019][lei58]{ .ad-cite } (minimisation, anonymisation or pseudonymisation where the aim allows).

</div>

!!! warning "Not applicable: consent and children's consent"
    Consent [Art. 6(1)(a)][gdpr-6]{ .ad-cite } and the age-13 rule for information society services [Art. 16 Lei 58/2019][lei58]{ .ad-cite } do not apply: the public app has no accounts and processes no personal data of its users beyond security logs, and the private app runs on public-task bases. <span class="ad-pill is-na">Not applicable</span>

## 6. Rights of the people in the data { #rights }

Each right in [Arts. 12–22 GDPR][gdpr-12]{ .ad-cite } either works normally, is limited by law, or does not apply to a public-task basis. The platform must support the first group and document the rest.

| Right | Article | How it works in Ad Omnia | Status |
| --- | --- | --- | --- |
| Information | [13][gdpr-13]{ .ad-cite } / [14][gdpr-14]{ .ad-cite } | Operators: notice at onboarding. Incident subjects: data is collected indirectly in an emergency; individual notice is impossible or disproportionate, so a public notice per agency is used [Art. 14(5)(b) GDPR][gdpr-14]{ .ad-cite }. Public app: short notice about logs | <span class="ad-pill is-warn">Before go-live</span> |
| Access | [15][gdpr-15]{ .ad-cite } | Historical search by incident and the per-incident audit trail (<span class="ad-id">FR-HIST-1</span>, <span class="ad-id">FR-AUD-1</span>) let an agency find everything about a request. Limited where a legal duty of secrecy applies [Art. 20 Lei 58/2019][lei58]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Rectification | [16][gdpr-16]{ .ad-cite } | Incidents and resources are editable (<span class="ad-id">FR-INC-1</span>); every correction is itself logged | <span class="ad-pill is-ok">Built in</span> |
| Erasure | [17][gdpr-17]{ .ad-cite } | Does not apply while processing is needed for a legal obligation or public task [17(3)(b)][gdpr-17]{ .ad-cite } or for legal claims [17(3)(e)][gdpr-17]{ .ad-cite }. Free-text personal details must be erasable once the retention period ends — see the spotlight below | <span class="ad-pill is-warn">Before go-live</span> |
| Restriction | [18][gdpr-18]{ .ad-cite } | A "restricted" flag that hides a record from operational views without deleting it, to be added before go-live | <span class="ad-pill is-warn">Before go-live</span> |
| Portability | [20][gdpr-20]{ .ad-cite } | Does not apply to processing necessary for a public task [Art. 20(3) GDPR][gdpr-20]{ .ad-cite } | <span class="ad-pill is-na">Not applicable</span> |
| Objection | [21][gdpr-21]{ .ad-cite } | Applies to public-task processing, but the agency can show compelling grounds (emergency response) [Art. 21(1) GDPR][gdpr-21]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| No solely automated decisions | [22][gdpr-22]{ .ad-cite } | Predictions inform; recommendations need explicit confirmation, stored with an optional reason (<span class="ad-id">FR-REC-3</span>). Operators see a justification and a confidence level (<span class="ad-id">FR-REC-1</span>, <span class="ad-id">FR-PRD-1</span>) | <span class="ad-pill is-ok">Built in</span> |

Member States may restrict these rights by law for public security, defence or the prevention of crime, provided the restriction is necessary and proportionate [Art. 23 GDPR][gdpr-23]{ .ad-cite }.

<div class="ad-spotlight" markdown="1">
<p class="ad-spotlight-kicker">Spotlight · design tension</p>

### Immutable audit log vs. the right to erasure

**The conflict.** <span class="ad-id">NFR-INT-1</span> says no audit, order or decision record can ever be edited or deleted, and `init.sql` enforces it with a trigger. A person can ask for their data to be erased [Art. 17(1) GDPR][gdpr-17]{ .ad-cite }.

**Why it is lawful.** Erasure does not apply when keeping the data is necessary to comply with a legal obligation, to perform a public task, or to defend legal claims [Art. 17(3)(b) and (e) GDPR][gdpr-17]{ .ad-cite }. Emergency decision logs are exactly that kind of record.

**What the design must still do.**

1. Store **references, not personal details**, in `audit_log.details`: entity IDs and changed field *names*, never the text of a description or an order.
2. Keep personal free text only in the operational tables, where it can be erased or anonymised when its retention period ends [Art. 21 Lei 58/2019][lei58]{ .ad-cite }. The audit entry stays valid; it just points to a record that is now anonymised.
3. Identify operators by **station ID**, which is pseudonymous on its own [Art. 4(5) GDPR][gdpr-4]{ .ad-cite }; the station-to-person mapping (shift rosters) stays in the agency's own HR systems, outside Ad Omnia.
</div>

## 7. Security of processing { #security }

The controller and processor must implement measures appropriate to the risk, including pseudonymisation and encryption, confidentiality, availability and resilience, and regular testing [Art. 32 GDPR][gdpr-32]{ .ad-cite }. Data protection must be built in from the start and on by default [Art. 25 GDPR][gdpr-25]{ .ad-cite } [EDPB Guidelines 4/2019][edpb-25]{ .ad-cite }.

| Measure | Where it is in the design | Article | Status |
| --- | --- | --- | --- |
| One-way flow private → public; no inbound connection to the private app | <span class="ad-id">NFR-SEC-2</span> | [32(1)(b)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Private app on-premises, only the reverse proxy is published | Architecture, `docker-compose.yml` | [25(1)][gdpr-25]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Licenses stored with a slow, salted hash | <span class="ad-id">NFR-SEC-4</span>, `users.license` | [32(1)(a)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Tamper-evident audit, order and decision records | <span class="ad-id">NFR-INT-1</span>, `trg_audit_log_immutable` | [5(1)(f)][gdpr-5]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Confidential source data held in each plugin's own database, reachable only through the Plugin Validation Broker from the private app | Architecture: Plugin DB, Plugin Validation Broker | [25(1)][gdpr-25]{ .ad-cite }, [32(1)(b)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Plugins sandboxed: read-only, non-root, no capabilities, internal-only network | Plugin Validation Broker, `plugin` network | [25(1)][gdpr-25]{ .ad-cite }, [32(1)(b)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Keeps working offline with last data | <span class="ad-id">NFR-AVL-3</span>, <span class="ad-id">NFR-AVL-4</span> | [32(1)(b)–(c)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-ok">Built in</span> |
| Encryption at rest for free-text and JSON columns; TLS between services | Ad Omnia, before go-live | [32(1)(a)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-warn">Before go-live</span> |
| Differentiated access profiles and logged access to sensitive data (offence data; health data if a feed is ever not anonymised) | Ad Omnia, before go-live (today all stations have the same access) | [Art. 29 Lei 58/2019][lei58]{ .ad-cite } | <span class="ad-pill is-warn">Before go-live</span> |
| Breach response: notify CNPD within 72 h, data subjects if high risk; NIS2 early warning within 24 h | Agency procedure, supported by Ad Omnia | [33][gdpr-33]{ .ad-cite }, [34][gdpr-34]{ .ad-cite }, [DL 125/2025][dl125]{ .ad-cite } | <span class="ad-pill is-warn">Before go-live</span> |
| Security testing (OWASP Top 10, dependency CVE audit) | Ad Omnia, before go-live | [32(1)(d)][gdpr-32]{ .ad-cite } | <span class="ad-pill is-warn">Before go-live</span> |

## 8. Accountability { #accountability }

### Data protection impact assessment { #dpia }

A DPIA is required when processing is likely to result in a high risk [Art. 35(1) GDPR][gdpr-35]{ .ad-cite }. For a real deployment of Ad Omnia it is **mandatory**, because several triggers match:

<div class="ad-checks" markdown="1">

- [x] Offence data (Art. 10) processed with new technology (predictive AI) — [CNPD list, item 6(a)][cnpd798]{ .ad-cite }
- [x] Interconnection of personal data from several agencies into one picture — [CNPD list, item 6(c)][cnpd798]{ .ad-cite }
- [ ] Large-scale processing of health data, and its electronic transmission — not triggered while INEM victim data arrives anonymised ([Art. 35(3)(b) GDPR][gdpr-35]{ .ad-cite }, [CNPD list, item 1][cnpd798]{ .ad-cite })
- [ ] Tracking employees' location to evaluate them — avoided by design, as long as vehicle positions are never used to rate crews ([CNPD list, item 3][cnpd798]{ .ad-cite })

</div>

If the DPIA shows a high residual risk, the controller must consult the CNPD before starting [Art. 36 GDPR][gdpr-36]{ .ad-cite }. While the proof of concept runs only on open, synthetic and test data, no DPIA is required. If it is used with real personal data from an agency, including in a pilot, the DPIA comes first. This report is the prior risk analysis it can build on.

### Record of processing activities { #records }

Each controller must keep a record of its processing [Art. 30(1) GDPR][gdpr-30]{ .ad-cite }. Draft entries an agency can adopt:

| Field ([Art. 30(1)][gdpr-30]{ .ad-cite }) | Private app: operational picture | Public app: citizen information | AI engine: model training |
| --- | --- | --- | --- |
| Purpose | Coordinate emergency response | Inform citizens of active incidents and warnings | Forecast incident progression and risk |
| Data subjects | Operators, crews, persons involved in incidents | Visitors (IP only) | Persons in historical incidents |
| Data categories | Station IDs, decisions, incident and resource data, possible offence data (health data only if not anonymised at source) | IP address, timestamp, requested URL | Pseudonymised incident features, locations generalised to a grid |
| Recipients | Other agencies in the shared picture; public app (validated, non-confidential incidents only) | None | None (models only) |
| Transfers outside the EU | None (on-premises) | None if hosted in the EU | None |
| Retention (proposal, to be fixed by each agency) | Legal period for operational records; free text anonymised after incident closure + review period | 30 days | Until model retirement; raw data deleted after feature extraction |
| Security measures | [§ 7](#security) | [§ 7](#security), log rotation | Pseudonymisation, access limited to the AI service |

### Data protection officer

Public authorities must designate a DPO [Art. 37(1)(a) GDPR][gdpr-37]{ .ad-cite } [Art. 12 Lei 58/2019][lei58]{ .ad-cite }. In Portugal the DPO also runs periodic and unannounced audits and raises staff awareness of security incidents [Art. 11 Lei 58/2019][lei58]{ .ad-cite }. Every agency already has one; the platform supports their work with exportable audit trails (<span class="ad-id">FR-AUD-1</span>) and this report.

### Transfers outside the EU

Personal data may leave the EU only under an adequacy decision or appropriate safeguards [Arts. 44–46 GDPR][gdpr-45]{ .ad-cite }. The private app is on-premises and the public app should be hosted in the EU, so no transfer is needed. If an agency chooses a provider outside the EU, transfers to US companies certified under the EU–US Data Privacy Framework rely on the Commission's adequacy decision [Decision (EU) 2023/1795][dpf]{ .ad-cite }, upheld by the General Court in *Latombe v Commission* (T-553/23, 3 September 2025).

## 9. AI and anonymisation { #ai }

### Anonymised or only pseudonymised?

Anonymised data is outside the GDPR; pseudonymised data is still personal data [Art. 4(5) GDPR][gdpr-4]{ .ad-cite } [Recital 26 GDPR][gdpr-r26]{ .ad-cite }. The difference matters for training data, because re-identification is easier than it seems: postcode, date of birth and sex alone re-identify most people, and the Netflix Prize dataset was de-anonymised by matching a handful of ratings with public IMDb profiles ([WP29 Opinion 05/2014][wp216]{ .ad-cite }). Incident locations are the equivalent quasi-identifier here: an exact point often *is* a home address.

<div class="ad-steps" markdown="1">

1. **Prefer synthetic data.** The simulation module already generates synthetic incidents (Simulated Incident), fully isolated from live data.
2. **Generalise locations.** Snap historical incident points to a grid or parish level before training; risk ratings are already per zone.
3. **Drop free text.** Train on structured features (type, severity, time, weather, zone), never on descriptions.
4. **Destroy the raw extract** once features are built, so the training set can be treated as anonymous; until then it is personal data.

</div>

### The AI Act

| Question | Answer | Citation |
| --- | --- | --- |
| Is the proof of concept covered? | No. Research, testing and development before placing on the market or putting into service is excluded | [Art. 2(8) AI Act][aia-2]{ .ad-cite } |
| Would the deployed recommendation engine be high-risk? | Yes. AI used to dispatch, or set priority in the dispatch of, police, firefighters and medical aid is listed | [Annex III, 5(d)][aia-annex3]{ .ad-cite }, [Art. 6(2)][aia-6]{ .ad-cite } |
| From when? | 2 December 2027 for Annex III systems, after the Digital Omnibus | [Regulation (EU) 2026/1744][omnibus]{ .ad-cite } |
| What would the provider have to show? | Risk management, data governance for training data, automatic logging, transparency to deployers, human oversight | [Arts. 9][aia-9]{ .ad-cite }, [10][aia-10]{ .ad-cite }, [12][aia-12]{ .ad-cite }, [13][aia-13]{ .ad-cite }, [14][aia-14]{ .ad-cite } |
| What would agencies have to do? | Use it as instructed, assign human oversight, keep logs; public bodies run a fundamental rights impact assessment first | [Art. 26][aia-26]{ .ad-cite }, [Art. 27][aia-27]{ .ad-cite } |

The platform's requirements already cover the core of these obligations: confirmation before action (<span class="ad-id">FR-REC-3</span>), a justification per recommendation (<span class="ad-id">FR-REC-1</span>), confidence, generation time and input data for every prediction (<span class="ad-id">FR-PRD-1</span>), and the engine failing without taking the platform down (<span class="ad-id">NFR-AVL-2</span>).

## 10. Before go-live { #go-live }

What has to be in place before the platform processes real personal data, and who is responsible for it.

| What | Who | Law |
| --- | --- | --- |
| Data protection impact assessment, and prior consultation of the CNPD if a high risk remains ([§ 8](#dpia)) | Agency, with Ad Omnia's technical input | [Arts. 35–36 GDPR][gdpr-35]{ .ad-cite } |
| Written confirmation from INEM that victim data in its API is anonymised and cannot be re-identified, even when combined with incident location and time | Ad Omnia, with INEM | [Recital 26 GDPR][gdpr-r26]{ .ad-cite } |
| Record of processing activities ([§ 8](#records)) | Agency | [Art. 30 GDPR][gdpr-30]{ .ad-cite } |
| Privacy notices: public app, operators, and a public notice for incident subjects | Agency | [Arts. 13–14 GDPR][gdpr-13]{ .ad-cite } |
| Retention periods for incidents, observations, orders and logs | Agency | [Art. 5(1)(e) GDPR][gdpr-5]{ .ad-cite }, [Art. 21 Lei 58/2019][lei58]{ .ad-cite } |
| Processor contract with Ad Omnia; joint-controller arrangement between agencies sharing one picture | Agency and Ad Omnia | [Arts. 26 and 28 GDPR][gdpr-28]{ .ad-cite } |
| Breach and incident procedure: CNPD within 72 h, NIS2 early warning within 24 h | Agency, supported by Ad Omnia | [Arts. 33–34 GDPR][gdpr-33]{ .ad-cite }, [DL 125/2025][dl125]{ .ad-cite } |
| Connector plugins map sources to structured fields and drop names, phone numbers and clinical notes at ingestion | Ad Omnia | [Art. 5(1)(c)][gdpr-5]{ .ad-cite }, [Art. 25 GDPR][gdpr-25]{ .ad-cite } |
| Audit entries store IDs and field names only, never personal details | Ad Omnia | [Art. 17(3)][gdpr-17]{ .ad-cite }, [Art. 25 GDPR][gdpr-25]{ .ad-cite } |
| "Restricted" flag and anonymisation of free text in closed incidents | Ad Omnia | [Art. 18 GDPR][gdpr-18]{ .ad-cite }, [Art. 21 Lei 58/2019][lei58]{ .ad-cite } |
| Encryption at rest and TLS between services; separate access profiles and logged access for sensitive data | Ad Omnia | [Art. 32 GDPR][gdpr-32]{ .ad-cite }, [Art. 29 Lei 58/2019][lei58]{ .ad-cite } |
| Security testing (OWASP Top 10, dependency audit) | Ad Omnia | [Art. 32(1)(d) GDPR][gdpr-32]{ .ad-cite } |
| Training data policy: synthetic first, locations generalised to a grid, no free text | Ad Omnia | [Art. 89 GDPR][gdpr-89]{ .ad-cite }, [Art. 31 Lei 58/2019][lei58]{ .ad-cite } |
| AI Act documentation for the recommendation engine (risk management, logging, human oversight), from 2 December 2027 | Ad Omnia as provider | [Arts. 9–14 AI Act][aia-14]{ .ad-cite } |
| Fundamental rights impact assessment before using the recommendation engine | Agency as deployer | [Art. 27 AI Act][aia-27]{ .ad-cite } |

??? abstract "Glossary"

    **Personal data** — any information about an identified or identifiable natural person [Art. 4(1)][gdpr-4]{ .ad-cite }.<br>
    **Processing** — anything done with personal data: collecting, storing, consulting, combining, erasing [Art. 4(2)][gdpr-4]{ .ad-cite }.<br>
    **Pseudonymisation** — data that can no longer be attributed to a person without extra information kept separately; still personal data [Art. 4(5)][gdpr-4]{ .ad-cite }.<br>
    **Anonymisation** — data that no longer relates to an identifiable person; outside the GDPR [Recital 26][gdpr-r26]{ .ad-cite }.<br>
    **Controller / processor** — who decides purposes and means / who processes on the controller's behalf [Art. 4(7)–(8)][gdpr-4]{ .ad-cite }.<br>
    **Special categories** — health, genetic, biometric data, racial or ethnic origin, political opinions, religious beliefs, trade-union membership, sex life or sexual orientation [Art. 9(1)][gdpr-9]{ .ad-cite }.<br>
    **Personal data breach** — accidental or unlawful destruction, loss, alteration, disclosure of or access to personal data [Art. 4(12)][gdpr-4]{ .ad-cite }.<br>
    **DPIA** — Data Protection Impact Assessment [Art. 35][gdpr-35]{ .ad-cite }.<br>
    **CNPD** — Comissão Nacional de Proteção de Dados, the Portuguese supervisory authority [Art. 3 Lei 58/2019][lei58]{ .ad-cite }.

## References { #references }

<div class="ad-refs" markdown="1">

**Primary law**

1. Regulation (EU) 2016/679 (General Data Protection Regulation), OJ L 119, 4.5.2016 — [EUR-Lex][gdpr] · article reader: [gdpr-info.eu](https://gdpr-info.eu/)
2. Lei n.º 58/2019, de 8 de agosto — execução do RGPD — [Diário da República][lei58]
3. Directive (EU) 2016/680 (Law Enforcement Directive) — [EUR-Lex][led]
4. Lei n.º 59/2019, de 8 de agosto — tratamento de dados para prevenção, investigação e repressão de infrações penais — [Diário da República][lei59]
5. Regulation (EU) 2024/1689 (Artificial Intelligence Act) — [EUR-Lex][aia] · article reader: [artificialintelligenceact.eu](https://artificialintelligenceact.eu/)
6. Regulation (EU) 2026/1744 (Digital Omnibus on AI), in force 27 July 2026 — summary: [aiacto.eu][omnibus]
7. Directive (EU) 2022/2555 (NIS2) — [EUR-Lex][nis2]
8. Decreto-Lei n.º 125/2025, de 4 de dezembro — regime jurídico da cibersegurança — [Diário da República (PDF)][dl125]
9. Directive 2002/58/EC (ePrivacy) — [EUR-Lex][eprivacy]
10. Lei n.º 41/2004, de 18 de agosto — privacidade nas comunicações eletrónicas — [Diário da República][lei41]
11. Lei n.º 27/2006, de 3 de julho — Lei de Bases da Proteção Civil — [Diário da República][lei27]
12. Charter of Fundamental Rights of the EU, Art. 8 — [EUR-Lex][charter]
13. Treaty on the Functioning of the EU, Art. 16 — [EUR-Lex][tfeu]
14. Constituição da República Portuguesa, Art. 35 — [Parlamento][crp]

**Authorities, guidance and case law**

15. CNPD, Regulamento n.º 798/2018 — lista de tratamentos sujeitos a AIPD, DR 2.ª série, n.º 231, 30.11.2018 — [copy (PDF)][cnpd798]
16. Commission Implementing Decision (EU) 2023/1795 (EU–US Data Privacy Framework) — [EUR-Lex][dpf]
17. EDPB, Guidelines 07/2020 on the concepts of controller and processor — [EDPB][edpb-roles]
18. EDPB, Guidelines 4/2019 on Article 25 Data Protection by Design and by Default — [EDPB][edpb-25]
19. Article 29 Working Party, Opinion 05/2014 on Anonymisation Techniques (WP216) — [PDF][wp216]
20. CJEU, C-582/14 *Breyer*, 19 October 2016 — [CURIA][breyer]

</div>

[gdpr]: https://eur-lex.europa.eu/eli/reg/2016/679/oj "Regulation (EU) 2016/679 (GDPR) — EUR-Lex"
[gdpr-2]: https://gdpr-info.eu/art-2-gdpr/ "GDPR Article 2 — Material scope"
[gdpr-4]: https://gdpr-info.eu/art-4-gdpr/ "GDPR Article 4 — Definitions"
[gdpr-5]: https://gdpr-info.eu/art-5-gdpr/ "GDPR Article 5 — Principles"
[gdpr-6]: https://gdpr-info.eu/art-6-gdpr/ "GDPR Article 6 — Lawfulness of processing"
[gdpr-7]: https://gdpr-info.eu/art-7-gdpr/ "GDPR Article 7 — Conditions for consent"
[gdpr-9]: https://gdpr-info.eu/art-9-gdpr/ "GDPR Article 9 — Special categories of personal data"
[gdpr-10]: https://gdpr-info.eu/art-10-gdpr/ "GDPR Article 10 — Criminal convictions and offences"
[gdpr-12]: https://gdpr-info.eu/art-12-gdpr/ "GDPR Article 12 — Transparent information"
[gdpr-13]: https://gdpr-info.eu/art-13-gdpr/ "GDPR Article 13 — Information when data is collected from the data subject"
[gdpr-14]: https://gdpr-info.eu/art-14-gdpr/ "GDPR Article 14 — Information when data is not obtained from the data subject"
[gdpr-15]: https://gdpr-info.eu/art-15-gdpr/ "GDPR Article 15 — Right of access"
[gdpr-16]: https://gdpr-info.eu/art-16-gdpr/ "GDPR Article 16 — Right to rectification"
[gdpr-17]: https://gdpr-info.eu/art-17-gdpr/ "GDPR Article 17 — Right to erasure"
[gdpr-18]: https://gdpr-info.eu/art-18-gdpr/ "GDPR Article 18 — Right to restriction of processing"
[gdpr-20]: https://gdpr-info.eu/art-20-gdpr/ "GDPR Article 20 — Right to data portability"
[gdpr-21]: https://gdpr-info.eu/art-21-gdpr/ "GDPR Article 21 — Right to object"
[gdpr-22]: https://gdpr-info.eu/art-22-gdpr/ "GDPR Article 22 — Automated individual decision-making"
[gdpr-23]: https://gdpr-info.eu/art-23-gdpr/ "GDPR Article 23 — Restrictions"
[gdpr-25]: https://gdpr-info.eu/art-25-gdpr/ "GDPR Article 25 — Data protection by design and by default"
[gdpr-26]: https://gdpr-info.eu/art-26-gdpr/ "GDPR Article 26 — Joint controllers"
[gdpr-28]: https://gdpr-info.eu/art-28-gdpr/ "GDPR Article 28 — Processor"
[gdpr-30]: https://gdpr-info.eu/art-30-gdpr/ "GDPR Article 30 — Records of processing activities"
[gdpr-32]: https://gdpr-info.eu/art-32-gdpr/ "GDPR Article 32 — Security of processing"
[gdpr-33]: https://gdpr-info.eu/art-33-gdpr/ "GDPR Article 33 — Notification of a breach to the supervisory authority"
[gdpr-34]: https://gdpr-info.eu/art-34-gdpr/ "GDPR Article 34 — Communication of a breach to the data subject"
[gdpr-35]: https://gdpr-info.eu/art-35-gdpr/ "GDPR Article 35 — Data protection impact assessment"
[gdpr-36]: https://gdpr-info.eu/art-36-gdpr/ "GDPR Article 36 — Prior consultation"
[gdpr-37]: https://gdpr-info.eu/art-37-gdpr/ "GDPR Article 37 — Designation of the DPO"
[gdpr-39]: https://gdpr-info.eu/art-39-gdpr/ "GDPR Article 39 — Tasks of the DPO"
[gdpr-45]: https://gdpr-info.eu/art-45-gdpr/ "GDPR Article 45 — Transfers on the basis of an adequacy decision"
[gdpr-89]: https://gdpr-info.eu/art-89-gdpr/ "GDPR Article 89 — Safeguards for research and statistics"
[gdpr-r26]: https://gdpr-info.eu/recitals/no-26/ "GDPR Recital 26 — Not applicable to anonymous data"
[gdpr-r30]: https://gdpr-info.eu/recitals/no-30/ "GDPR Recital 30 — Online identifiers"
[gdpr-r46]: https://gdpr-info.eu/recitals/no-46/ "GDPR Recital 46 — Vital interests"
[lei58]: https://diariodarepublica.pt/dr/detalhe/lei/58-2019-123815982 "Lei n.º 58/2019, de 8 de agosto — Diário da República"
[lei59]: https://diariodarepublica.pt/dr/detalhe/lei/59-2019-123815983 "Lei n.º 59/2019, de 8 de agosto — Diário da República"
[lei41]: https://diariodarepublica.pt/dr/detalhe/lei/41-2004-480710 "Lei n.º 41/2004, de 18 de agosto — Diário da República"
[lei27]: https://diariodarepublica.pt/dr/detalhe/lei/27-2006-537862 "Lei n.º 27/2006, de 3 de julho — Diário da República"
[dl125]: https://files.diariodarepublica.pt/1s/2025/12/23400/0000400068.pdf "Decreto-Lei n.º 125/2025, de 4 de dezembro — Diário da República"
[cnpd798]: https://omcentro.com/ficheiros/docs/r_798_2018.pdf "CNPD Regulamento n.º 798/2018 — list of processing subject to DPIA"
[led]: https://eur-lex.europa.eu/eli/dir/2016/680/oj "Directive (EU) 2016/680 — EUR-Lex"
[aia]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj "Regulation (EU) 2024/1689 (AI Act) — EUR-Lex"
[aia-2]: https://artificialintelligenceact.eu/article/2/ "AI Act Article 2 — Scope"
[aia-6]: https://artificialintelligenceact.eu/article/6/ "AI Act Article 6 — Classification of high-risk AI systems"
[aia-9]: https://artificialintelligenceact.eu/article/9/ "AI Act Article 9 — Risk management system"
[aia-10]: https://artificialintelligenceact.eu/article/10/ "AI Act Article 10 — Data and data governance"
[aia-12]: https://artificialintelligenceact.eu/article/12/ "AI Act Article 12 — Record-keeping"
[aia-13]: https://artificialintelligenceact.eu/article/13/ "AI Act Article 13 — Transparency to deployers"
[aia-14]: https://artificialintelligenceact.eu/article/14/ "AI Act Article 14 — Human oversight"
[aia-26]: https://artificialintelligenceact.eu/article/26/ "AI Act Article 26 — Obligations of deployers"
[aia-27]: https://artificialintelligenceact.eu/article/27/ "AI Act Article 27 — Fundamental rights impact assessment"
[aia-annex3]: https://artificialintelligenceact.eu/annex/3/ "AI Act Annex III — High-risk AI systems"
[omnibus]: https://www.aiacto.eu/en/blog/digital-omnibus-ai-act-report-2027 "Digital Omnibus on AI — Regulation (EU) 2026/1744 (summary)"
[nis2]: https://eur-lex.europa.eu/eli/dir/2022/2555/oj "Directive (EU) 2022/2555 (NIS2) — EUR-Lex"
[eprivacy]: https://eur-lex.europa.eu/eli/dir/2002/58/oj "Directive 2002/58/EC (ePrivacy) — EUR-Lex"
[charter]: https://eur-lex.europa.eu/eli/treaty/char_2012/oj "Charter of Fundamental Rights of the EU — EUR-Lex"
[tfeu]: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12012E/TXT "Treaty on the Functioning of the EU — EUR-Lex"
[crp]: https://www.parlamento.pt/Legislacao/Paginas/ConstituicaoRepublicaPortuguesa.aspx "Constituição da República Portuguesa — Parlamento"
[dpf]: https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj "Commission Implementing Decision (EU) 2023/1795 — EUR-Lex"
[edpb-roles]: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-072020-concepts-controller-and-processor-gdpr_en "EDPB Guidelines 07/2020"
[edpb-25]: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en "EDPB Guidelines 4/2019"
[wp216]: https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2014/wp216_en.pdf "WP29 Opinion 05/2014 on Anonymisation Techniques"
[breyer]: https://curia.europa.eu/juris/liste.jsf?num=C-582/14 "CJEU C-582/14 Breyer"
