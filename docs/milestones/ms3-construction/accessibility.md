---
date: 2026-10-29
order: 13
description: Accessibility audit, matrix and WCAG 2.2 AA conformance
---

# Accessibility

Ad Omnia is used under pressure, in control rooms that run around the clock, by people who may have a disability or develop one during their career. The public app is used by any citizen during an emergency. Both have to work without a mouse, without sight, without colour and without reading long text.

This page is the accessibility audit of the current mockups of both applications: the matrix of every screen against every user profile and the conformance status against WCAG 2.2 level AA.

## Scope and method

| Item             | Detail                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Applications     | Control room console (private app, `/`) and public app (`/publico`), both in `Ad-Omnia/mockups`, every screen.                      |
| Target           | WCAG 2.2 level AA, which includes EN 301 549 (WCAG 2.1 AA) required by law.                                                         |
| Automated audit  | axe-core 4.14 through Playwright on 28 screens, each in light and dark theme (56 scans), rules for WCAG 2.0, 2.1 and 2.2 A and AA.  |
| Contrast         | Ratios computed for every colour token and every built-in palette (severity, risk, agency, resource type, status).                  |
| Keyboard         | Eight complete flows driven with the keyboard only, plus a check that the first 60 tab stops all show a focus indicator.            |
| Screen reader    | Accessibility tree tests (roles, names, states, live regions) and one complete flow walked through as a screen reader user.         |
| Zoom and spacing | Five screens at 480 by 270 CSS px (400 % of 1920 by 1080) and 320 by 640 CSS px, and with WCAG text spacing overrides.              |
| Manual review    | Every primitive in `src/components/ui`, the shell, the map layer, each section and the public app, against the seven user profiles. |
| Date             | 2026-10-29                                                                                                                          |

## Applicable legislation

| Instrument                                                                                  | What it requires                                                                                                                                                                                              | How it applies to Ad Omnia                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directive (EU) 2016/2102, transposed by Decreto-Lei n.º 83/2018                             | Websites and mobile apps of public sector bodies must be perceivable, operable, understandable and robust, following EN 301 549. Each one needs a published accessibility statement and a feedback mechanism. | Both apps are run by public bodies (ANEPC, municipal civil protection, fire services). The public app is fully in scope. The private app is an intranet application published after 2019, so it is in scope too. |
| Exemption for maps in the same directive (art. 1(4)(f))                                     | Online maps and mapping services are exempt, as long as the essential information of maps meant for navigation is given in an accessible digital form.                                                        | The map can stay visual, but its essential content must exist in text. That is the role of "Mapa em lista" in the console and of the incident list in the public app.                                            |
| EN 301 549 V3.2.1                                                                           | Harmonised standard. Chapter 9 (web) points to WCAG 2.1 AA. Chapter 11 covers software.                                                                                                                       | Legal baseline for both apps. We target WCAG 2.2 AA, which includes every WCAG 2.1 AA criterion.                                                                                                                 |
| Directive (EU) 2019/882 (European Accessibility Act), transposed by Decreto-Lei n.º 82/2022 | Accessibility of listed consumer products and services from 28 June 2025, including the answering of emergency calls to 112.                                                                                  | Ad Omnia is not a 112 answering service, so it is not directly listed. It feeds the same chain, so we follow the same requirements as good practice, mainly for the public app.                                  |
| Lei n.º 46/2006                                                                             | Forbids discrimination on the grounds of disability.                                                                                                                                                          | Denying a control room job or a public service because the tool cannot be used is a risk the platform must not create.                                                                                           |
| Lei n.º 4/2019 and Decreto-Lei n.º 29/2001                                                  | Employment quotas for people with disabilities in private companies and in the public administration.                                                                                                         | Operators and analysts with disabilities are expected users of the private app, not an edge case.                                                                                                                |

Before launch, each app needs an accessibility statement made with the template of AMA (acessibilidade.gov.pt), linked from the app, with a contact for reporting barriers.

## User profiles

| Profile              | What we checked                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blind                | Screen reader names, roles and states, reading order, live announcements, text alternative to the map and charts, keyboard reach of every action.     |
| Low vision           | Text and component contrast in both themes, visible focus that is never clipped or hidden, target size, zoom to 400 %, text spacing, projection mode. |
| Colour blindness     | No information by colour alone (severity, ball state, risk, availability), colour-blind palettes, contrast warning on custom colours.                 |
| Motor                | Keyboard only, no drag-only or double-click-only actions, target size, no traps, single key shortcuts that can be turned off, short tab paths.        |
| Deafness             | No information by sound only. Neither app has audio. Any future audible alarm needs a visual equivalent, which the ball already provides.             |
| Cognitive            | Consistent layout, predictable focus, plain words, confirmation before sending orders, required fields marked, motion that can be reduced.            |
| Low digital literacy | Visible names for navigation on request, no hidden gestures needed, plain words, visible state.                                                       |

## Accessibility matrix

One row per screen of both applications, one column per profile. **Pass** no problem found. **N/A** does not apply.

### Control room console

| #   | Screen                                        | Blind | Low vision | Colour blindness | Motor | Deaf | Cognitive | Low digital literacy |
| --- | --------------------------------------------- | ----- | ---------- | ---------------- | ----- | ---- | --------- | -------------------- |
| C01 | Splash and loading                            | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C02 | Operational map (markers, routes, forecast)   | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C03 | Left sidebar and logo ball                    | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C04 | Command palette                               | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C05 | Alerts card                                   | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C06 | Alerts full screen                            | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C07 | Incidents list                                | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C08 | Incidents full screen table                   | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C09 | Incident detail, recommendations              | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C10 | New incident form                             | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C11 | Resources list and detail, assign picker      | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C12 | Assignment card on the map (route, ETA, risk) | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C13 | Staged orders review and send                 | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C14 | Orders card, response form                    | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C15 | Orders full screen                            | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C16 | Public warnings, new warning form             | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C17 | Risk forecast card and choropleth             | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C18 | History (full page)                           | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C19 | Risk history (full page, charts)              | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C20 | Consultar fontes (lookup and detail)          | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C21 | Layers, filters and source health             | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C22 | Map controls and projection mode              | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C23 | Settings                                      | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C24 | Manage plugins                                | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C25 | Decision log                                  | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C26 | Simulation plugin (full page, own map)        | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| C27 | Mapa em lista                                 | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |

### Public app

| #   | Screen                                                       | Blind | Low vision | Colour blindness | Motor | Deaf | Cognitive | Low digital literacy |
| --- | ------------------------------------------------------------ | ----- | ---------- | ---------------- | ----- | ---- | --------- | -------------------- |
| P01 | Emergency map (incidents, affected areas, vehicles on scene) | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| P02 | Left rail (warnings with unread count, incident list)        | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| P03 | Public warnings                                              | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| P04 | Incident list                                                | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| P05 | Incident detail                                              | Pass  | Pass       | Pass             | Pass  | Pass | Pass      | Pass                 |
| P06 | Filters (zone and incident type)                             | Pass  | Pass       | Pass             | Pass  | N/A  | Pass      | Pass                 |
| P07 | Language menu                                                | Pass  | Pass       | N/A              | Pass  | N/A  | Pass      | Pass                 |
| P08 | Data freshness and outage warning                            | Pass  | Pass       | Pass             | N/A   | Pass | Pass      | Pass                 |

## How each profile is covered

### Blind

- Every icon-only control has an accessible name, and counts are part of it ("Alertas, 2 pendentes", "Avisos à população, 3 por ler").
- The logo ball says its pending states in words. Map markers are buttons named with type, place, severity and vehicles on scene.
- "Saltar para o mapa em lista" is the first tab stop of the console. "Mapa em lista" gives every incident and resource on the map as tables, with the same filters. The public app opens its incident list from its first tab stop.
- The risk forecast lists every municipality of the selected region with search, and municipalities can be found from the command palette.
- Every chart carries a data table, and the risk history brush is a slider with a spoken value.
- New alerts, overdue orders and form errors are announced at once. Staged and sent orders and source outages are announced politely.
- Dialogs, the palette, the assignment card and cards take focus when they open and give it back when they close. Full pages make the map behind them inert.
- The page language follows the language setting, and language names carry their own language.

### Low vision

- Text reaches 4.5:1 and controls 3:1 in both themes, with every built-in palette.
- Focus is always visible: a 2 px outline on buttons and an inset ring on fields and list rows, so scroll containers never clip it.
- A focused map marker pans out from under open cards.
- At 480 by 270 and 320 by 640 CSS px the sidebar collapses to the ball, the palette gives every section, cards fill the width and dialogs scroll as a whole.
- Text spacing overrides do not clip any heading, button or label.
- Tooltips stay open while the pointer is over them and close with Esc.

### Colour blindness

- Severity on the map is a shape cue as well as a colour: low has no extra outline, moderate one, high two, critical three.
- Severity, state and risk are always written in words in lists, cards and badges.
- Custom colours in Settings show their text contrast and warn below 4.5:1.

### Motor

- Every flow works with the keyboard alone. Drags have a single pointer path (assign picker with sector). Double click on the ball has Shift+Enter and the palette.
- The map markers are one tab stop. Arrow keys move between markers by direction, Home and End jump to the first and last.
- Targets are at least 24 by 24 px. The edge strips are 24 px wide.
- `[` and `]` can be turned off in Settings, Acessibilidade.

### Deafness

- Neither app uses sound. Every alert is a visual change (ball colour, badge, highlighted row) plus a text announcement.

### Cognitive

- Required fields are marked and say what is missing when a form is sent incomplete.
- Sending orders asks for confirmation.
- "Reduzir movimento" in Settings stops the alert pulse and all transitions, as does the system reduced motion setting.

### Low digital literacy

- "Mostrar nomes na barra lateral" in Settings shows the section names next to their icons.
- The public app has two named buttons on the left (warnings and incidents) and two on the right (filters and language), and every incident opens with a tap.

## Public app

The public app shows only incidents validated and published by an operator, with no operational data.

| Feature             | Accessibility detail                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map                 | Same markers as the console, with severity rings. Affected area drawn for the incident types that publish it. Vehicles on scene shown only on fires for now.                                         |
| Configurable fields | `src/public/fields.ts` sets, per incident type, which extra fields the public sees (`area`, `vehicles`). Today: area for fires, floods and hazardous materials, vehicles for forest and urban fires. |
| Warnings            | Button with the count of unread warnings, cleared when the warnings dialog opens. Each warning shows its full headline and message on several lines, severity in words, area and time.               |
| Incident list       | Dialog with every incident shown on the map, the text alternative to the map.                                                                                                                        |
| Incident detail     | Card with severity, state, approximate location, affected area in km², vehicles on scene when published, last update and description.                                                                |
| Filters             | Zone (for example Região de Aveiro) and incident type with icon and word. The filter button shows how many filters are on.                                                                           |
| Language            | Menu with Português and English, each in its own language.                                                                                                                                           |
| Freshness           | "Atualizado há 1 min" chip that hides into the rail after 7 s and comes back when the data goes out of date, as a status message.                                                                    |
| Small screens       | At phone width the detail becomes a bottom card, the rails retract and the map keeps its full width.                                                                                                 |

## Colour contrast

| Use                                                  | Light  | Dark   | Needed |
| ---------------------------------------------------- | ------ | ------ | ------ |
| `ink` text                                           | 18.1:1 | 15.4:1 | 4.5:1  |
| `ink-muted` text                                     | 6.4:1  | 7.5:1  | 4.5:1  |
| `ink-faint` text (dates, latency, placeholders)      | 5.1:1  | 5.5:1  | 4.5:1  |
| `warning-ink` text                                   | 5.1:1  | 8.0:1  | 4.5:1  |
| `danger-ink` text                                    | 5.6:1  | 6.2:1  | 4.5:1  |
| `success-ink` text                                   | 5.1:1  | 7.3:1  | 4.5:1  |
| `control` border (inputs, dropdowns, toggles, chips) | 3.7:1  | 3.5:1  | 3:1    |
| Focus outline `blue-ink`                             | 5.6:1  | 7.8:1  | 3:1    |

All 38 colours of the built-in palettes reach at least 4.5:1 with their text colour, which is chosen as the one with the higher ratio.

## Keyboard

| Flow                                                                           | Result |
| ------------------------------------------------------------------------------ | ------ |
| Skip to "Mapa em lista" and open an incident from it                           | Pass   |
| Every one of the first 60 tab stops shows a focus indicator                    | Pass   |
| Open Settings, Tab 30 times, close with Esc, focus back on the Settings button | Pass   |
| Acknowledge an alert                                                           | Pass   |
| Map markers: one tab stop, arrows move between them, Enter opens one           | Pass   |
| Assign an own resource, stage the order and send it                            | Pass   |
| Create a new incident                                                          | Pass   |
| Public app: open the incident list, open an incident, filter by type           | Pass   |

| Key                     | Action                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Tab, Shift+Tab          | Move between controls. The first stop skips to the map as a list.                                  |
| Arrow keys, Home, End   | Move between map markers, and inside the palette, dropdowns, segmented controls and chart sliders. |
| Ctrl+K                  | Command palette, with every section, pending ball actions first.                                   |
| Shift+Enter on the ball | Run the ball action (same as double click).                                                        |
| Esc                     | Close the open dialog, popover, tooltip, palette or projection mode.                               |
| `[` and `]`             | Toggle the left and right rails in both apps. Can be turned off in Settings.                       |

## Dynamic messages

| Event                                     | Region          | Example                                                                        |
| ----------------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| New unacknowledged alert                  | `role="alert"`  | "Novo alerta: Ordem recusada, Mata Nacional de Vagos"                          |
| Order passes its acknowledgement deadline | `role="alert"`  | "Ordem sem confirmação: VFCI 01"                                               |
| Form sent with a required field empty     | `role="alert"`  | "Indique o local do incidente."                                                |
| Orders staged                             | `role="status"` | "1 ordem em fila"                                                              |
| Orders sent                               | `role="status"` | "1 ordem enviada"                                                              |
| Data source becomes unavailable           | `role="status"` | "Fonte indisponível: Fogos.pt"                                                 |
| Public data freshness                     | `role="status"` | "Atualizado há 1 min", or "Dados desatualizados. Última atualização às 14:02." |
| Palette search with no result             | `role="status"` | "Sem resultados para ..."                                                      |

## Screen reader test

**Flow:** an operator receives an alert, opens it, assigns an own resource and sends the order. A citizen opens the public app and reads an incident.

| Step                    | Expected output                                                                                                          | Result |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| Console loads           | Language `pt-PT`, title "Ad Omnia", landmarks main, "Secções principais", "Controlos do mapa", region "Mapa operacional" | Pass   |
| Ball                    | "Pesquisa e comandos, Alerta por confirmar, Ordem em atraso, botão"                                                      | Pass   |
| Sidebar                 | "Alertas, 2 pendentes, botão"                                                                                            | Pass   |
| A team refuses an order | Alert region: "Novo alerta: Ordem recusada, ..."                                                                         | Pass   |
| Palette                 | Combobox "Pesquisar locais, incidentes, meios ou ações" with the active option exposed                                   | Pass   |
| Resource assigned       | Dialog "Atribuir VFCI 02" takes focus                                                                                    | Pass   |
| Order sent              | Status region: "1 ordem enviada"                                                                                         | Pass   |
| Risk history            | Slider "Linha do tempo, Todo o país" with a spoken value, data table present                                             | Pass   |
| Public app loads        | Title "Ad Omnia, emergências ativas", status "Atualizado há 1 min", region "Mapa de emergências"                         | Pass   |
| Public incident         | Button "Incêndio florestal, Mata Nacional de Vagos, Elevada, 4 veículos no local", detail with "Veículos no local"       | Pass   |

These steps run as automated accessibility tree tests on every pull request. The same flow must also be run by a team member with NVDA on Firefox and Chrome, speech on, screen off. That run has not been done yet.

## Automated checks in CI

The workflow `.github/workflows/accessibility.yml` in `Ad-Omnia/mockups` runs on every pull request and every push to `main`:

1. Type check.
2. axe-core on the 28 screens in both themes, against WCAG 2.0, 2.1 and 2.2 A and AA. Any critical or serious violation fails the run.
3. The eight keyboard flows.
4. The screen reader tests.
5. Reflow at 480 by 270 and 320 by 640 CSS px and text spacing on five screens.

Run it locally with `npm run test:a11y`. Map tiles are not needed, so CI runs on a clean checkout.

## WCAG 2.2 AA conformance

Status of both applications against each level A and AA criterion.

| Criterion                                 | Level | Status   | Notes                                                                    |
| ----------------------------------------- | ----- | -------- | ------------------------------------------------------------------------ |
| 1.1.1 Non-text content                    | A     | Supports | Map as list, incident list, full municipality list, chart tables.        |
| 1.2.1 to 1.2.5 Time-based media           | A, AA | N/A      | No audio or video.                                                       |
| 1.3.1 Info and relationships              | A     | Supports | Tables, landmarks, named regions and groups.                             |
| 1.3.2 Meaningful sequence                 | A     | Supports |                                                                          |
| 1.3.3 Sensory characteristics             | A     | Supports |                                                                          |
| 1.3.4 Orientation                         | AA    | Supports |                                                                          |
| 1.3.5 Identify input purpose              | AA    | N/A      | No fields about the user.                                                |
| 1.4.1 Use of colour                       | A     | Supports | Severity rings, words everywhere.                                        |
| 1.4.2 Audio control                       | A     | N/A      |                                                                          |
| 1.4.3 Contrast (minimum)                  | AA    | Supports | Custom colours warn below 4.5:1.                                         |
| 1.4.4 Resize text                         | AA    | Supports | Checked at 200 % and 400 %.                                              |
| 1.4.5 Images of text                      | AA    | Supports |                                                                          |
| 1.4.10 Reflow                             | AA    | Supports | Checked at 320 CSS px. The map is exempt as two-dimensional content.     |
| 1.4.11 Non-text contrast                  | AA    | Supports |                                                                          |
| 1.4.12 Text spacing                       | AA    | Supports | Checked with the WCAG overrides.                                         |
| 1.4.13 Content on hover or focus          | AA    | Supports | Tooltips are hoverable, persistent and close with Esc.                   |
| 2.1.1 Keyboard                            | A     | Supports |                                                                          |
| 2.1.2 No keyboard trap                    | A     | Supports | Dialogs hold focus by design and close with Esc.                         |
| 2.1.4 Character key shortcuts             | A     | Supports | Can be turned off.                                                       |
| 2.2.1 Timing adjustable                   | A     | Supports |                                                                          |
| 2.2.2 Pause, stop, hide                   | A     | Supports | Reduce motion setting and OS setting.                                    |
| 2.3.1 Three flashes                       | A     | Supports |                                                                          |
| 2.4.1 Bypass blocks                       | A     | Supports | Skip links, landmarks, one tab stop for the markers.                     |
| 2.4.2 Page titled                         | A     | Supports |                                                                          |
| 2.4.3 Focus order                         | A     | Supports |                                                                          |
| 2.4.4 Link purpose (in context)           | A     | Supports |                                                                          |
| 2.4.5 Multiple ways                       | AA    | Supports |                                                                          |
| 2.4.6 Headings and labels                 | AA    | Supports |                                                                          |
| 2.4.7 Focus visible                       | AA    | Supports | Checked in CI.                                                           |
| 2.4.11 Focus not obscured (minimum)       | AA    | Supports | Map inert behind pages, markers pan clear of cards.                      |
| 2.5.1 Pointer gestures                    | A     | Supports |                                                                          |
| 2.5.2 Pointer cancellation                | A     | Supports |                                                                          |
| 2.5.3 Label in name                       | A     | Supports |                                                                          |
| 2.5.4 Motion actuation                    | A     | N/A      |                                                                          |
| 2.5.7 Dragging movements                  | AA    | Supports |                                                                          |
| 2.5.8 Target size (minimum)               | AA    | Supports |                                                                          |
| 3.1.1 Language of page                    | A     | Supports |                                                                          |
| 3.1.2 Language of parts                   | AA    | Supports |                                                                          |
| 3.2.1 On focus                            | A     | Supports |                                                                          |
| 3.2.2 On input                            | A     | Supports |                                                                          |
| 3.2.3 Consistent navigation               | AA    | Supports |                                                                          |
| 3.2.4 Consistent identification           | AA    | Supports |                                                                          |
| 3.2.6 Consistent help                     | A     | N/A      | No help mechanism yet.                                                   |
| 3.3.1 Error identification                | A     | Supports |                                                                          |
| 3.3.2 Labels or instructions              | A     | Supports | Required fields marked.                                                  |
| 3.3.3 Error suggestion                    | AA    | Supports |                                                                          |
| 3.3.4 Error prevention                    | AA    | Supports | Sending orders asks for confirmation.                                    |
| 3.3.7 Redundant entry                     | A     | Supports |                                                                          |
| 3.3.8 Accessible authentication (minimum) | AA    | N/A      | No login in the mockups. Station licences must not use a cognitive test. |
| 4.1.2 Name, role, value                   | A     | Supports |                                                                          |
| 4.1.3 Status messages                     | AA    | Supports |                                                                          |

Summary over the 55 criteria: 45 supported, 10 not applicable.
