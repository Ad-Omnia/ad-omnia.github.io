---
date: 2026-10-27
order: 12
description: Intellectual property of the platform, project license, and licenses of third-party software
---

# Software licenses and intellectual property

This document records who owns the intellectual property of Ad Omnia, the status of the project's own license, and the license of every third-party technology in the planned stack, with a check for conflicts and for commercial use.
External data sources (APIs, feeds and datasets) have their own terms and are covered in [Data source licenses](data-source-licenses.md).

## Intellectual property

### Applicable rules

The rule in force at the University of Aveiro is the [Regulamento de Direitos de Propriedade Industrial e Programas de Computador](https://www.ua.pt/file/51717), approved by the University Senate on 10 October 2001. The points that matter for Ad Omnia are:

| Point | What it says | Relevance |
| --- | --- | --- |
| 1.1 | The University owns the rights to creations made by teaching staff in their teaching or research functions. | Applies to any contribution from the advisors. |
| 1.2 | The University also owns creations made by other people in the exercise of their functions at the University, **or that used the University's means and resources**. | Applies to the team: the project is a course unit, supervised by University staff and developed with University resources. |
| 1.4 | The principles also apply to computer programs. | Covers the platform's code. |
| 4.1, 4.7 | The creator must inform the University within three months of completing the creation. | Defines how to ask the University for a decision. |
| 5.1, 5.2 | The University decides within 60 days. If it decides not to protect the creation, the creators acquire **all rights**, including exploitation. | Path to give the team full ownership. |
| 7.1, 8.1, 8.4 | If the University keeps the rights, it manages the exploitation, and the creators share the benefits, in equal parts unless they agree otherwise. | Applies if the University keeps the rights. |
| 9.3 | In contracts between the University and external entities, students taking part must accept in writing that the rights belong to the University or to the entity named in the contract. | Applies if Ad Omnia is later developed under a contract with an agency or company. |

### Academic phase (current)

Point 1.2 **applies** to Ad Omnia, so the project belongs to the University of Aveiro. Point 1.2 has two alternative conditions, and one is enough:

- **Exercise of functions at the University.** The team develops the project as students, within a course unit. This condition can be argued, since "functions" usually refers to staff and research fellows.
- **Use of the University's means and resources.** The project is developed within a course unit, supervised by University staff, and uses the University's facilities and infrastructure. This condition clearly holds.

The University holds the rights from the moment the code is created, not only when someone wants to commercialize it.

### If the project is commercialized

If the team wants to commercialize Ad Omnia in the future:

1. Inform the University under points 4 and 5 and ask for a written decision. The University decides whether it keeps the rights or leaves them to the team (point 5.2).
2. Agree in writing, within the team, how the rights are shared and who can grant licenses.
3. If the University keeps the rights, exploitation is managed by the University and the creators share the benefits (points 7.1 and 8).

## Project license

The repositories are private and the code belongs to the University of Aveiro (see above). The project is therefore licensed as **proprietary**: "Copyright Universidade de Aveiro. All rights reserved."

An open-source license is only possible if the University decides to publish the code. The analysis below shows that every dependency would also allow that.

## Third-party software

### Inventory

| Layer | Technology | License | How it is used |
| --- | --- | --- | --- |
| Frontend | React | MIT | Linked (in the frontend bundle) |
| Frontend | Vite | MIT | Build tool, not distributed |
| Frontend | MapLibre GL JS | BSD-3-Clause | Linked |
| Frontend | Geist, JetBrains Mono (fonts) | OFL-1.1 | Bundled |
| Reverse proxy | Nginx | BSD-2-Clause | Separate program |
| Backend | FastAPI | MIT | Linked |
| Backend and ingestion | Python | PSF-2.0 | Runtime |
| Ingestion | Apache Kafka | Apache-2.0 | Separate program |
| Real Time DB | TimescaleDB | Apache-2.0 (core) and Timescale License (additional features) | Separate program |
| Global DB | PostgreSQL | PostgreSQL License | Separate program |
| AI Service | LightGBM | MIT | Linked |
| AI Service | gRPC | Apache-2.0 | Linked |
| AI Service | Google OR-Tools | Apache-2.0 | Linked |
| Plugin sandboxing | Docker Engine | Apache-2.0 | Separate program |

**Linked** technologies are imported by our code, so their licenses apply to the combined work. **Bundled** fonts are shipped with the frontend. **Separate programs** run as their own processes and communicate over the network, so their licenses do not extend to Ad Omnia's code.

The other frontend libraries (React Router, Zustand, i18next, Lucide and others) are under MIT, ISC or BSD licenses.

### Conflicts

- **Between dependencies.** None. Every license in the inventory is permissive (MIT, BSD, ISC, PSF, PostgreSQL, Apache-2.0) or, for the fonts, the SIL Open Font License, with the exception of the Timescale License (see below). These licenses are compatible with each other.
- **With the project license.** None. All these licenses allow use in proprietary software, and would also allow the code to be published under an open-source license if the University decides to.
- **TimescaleDB.** Its additional features are under the Timescale License, which is not an open-source license. It runs as a separate program, so it does not conflict with any project license, but it must not be described as open source.

### Academic and commercial use

Every technology in the inventory allows commercial use.
The only restriction is in the Timescale License, which forbids offering TimescaleDB itself as a hosted database service to third parties. Ad Omnia uses the database internally, and its value is the platform, not the database, so the restriction does not apply.
The software dependencies therefore do not prevent commercial use. The limits on commercial use come from the data sources and from the ownership of the code, which would have to be settled with the University first.

### Obligations

The obligations apply when the software is **distributed**: when the frontend is served to citizens, when the private application is installed in a control room, and when the repositories are made public.

| Licenses | Technologies | Obligation |
| --- | --- | --- |
| MIT, BSD, PSF, PostgreSQL | React, Vite, MapLibre GL JS, FastAPI, LightGBM, Nginx, Python, PostgreSQL | Keep the copyright notice and license text |
| Apache-2.0 | Kafka, gRPC, OR-Tools, Docker Engine, TimescaleDB (core) | Keep the copyright notice, license text and `NOTICE` file (if any), and mark modified files |
| Timescale License | TimescaleDB (additional features) | Do not offer TimescaleDB as a service to third parties, and do not present it as open source |
| SIL Open Font License 1.1 | Geist, JetBrains Mono | Keep the license text with the font files, and do not sell the fonts on their own |

How the team will meet them:

1. A `THIRD_PARTY_LICENSES.md` file in each repository, listing every dependency and its license.
2. License comments are kept in the compiled frontend.
3. An "About / Licenses" page in both applications, linking to that file.
4. Only official Docker images are used, since they already include their licenses.

## Conclusion

- Ad Omnia belongs to the University of Aveiro under point 1.2 of the regulation in force, because it is developed with the University's means and resources. Any project license needs the University's agreement, through the advisors. The formal request to the University is only needed if the project is commercialized.
- No planned dependency has a license that conflicts with the others or with the project's proprietary license.
- Every planned dependency allows commercial use. The Timescale License restriction does not apply to the way Ad Omnia uses TimescaleDB.
- This analysis covers the planned stack. It must be repeated when the code exists and whenever a technology is added.
