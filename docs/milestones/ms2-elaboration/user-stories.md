---
title: User Stories
date: 2026-10-01
order: 2
description: User stories for commanders, operators and citizens
---

Comandante
1. Ver num único mapa em tempo real os incidentes, os meios e os dados de todas as entidades (COP).
2. Ver a previsão de progressão de um incidente com indicação do seu nível de confiança.
3. Receber recomendações de afetação e encaminhamento de meios, e poder aceitá-las, ajustá-las ou rejeitá-las.
4. Ver a localização e o estado dos meios de várias entidades no mesmo ecrã.
5. Atribuir tarefas ao operador e acompanhar o seu estado.
6. Consultar o registo das recomendações e decisões tomadas num incidente, para as justificar depois

Operador
7. Criar, atualizar e fechar incidentes e acompanhar o estado dos meios.
8. Registar as ordens transmitidas às equipas no terreno e a confirmação de receção.
9. Ser alertado de novos incidentes vindos dos feeds e de mudanças relevantes, e validá-los ou descartá-los.
11. Ver quando cada fonte de dados foi atualizada pela última vez.
12. Consultar a disponibilidade hospitalar (SNS) e a posição dos meios aéreos.

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

- The map is available without registration or login, and works on mobile browsers as well as desktop.
- The map shows incidents that are currently active, closed incidents are not shown in the map.
- Any incident type (wildfires, traffic accidents, floods, structural incidents, etc.) is displayed, each with a distinct icon and a small description.
- Selecting an incident shows its type, approximate location, current status and the time of the last update.
- The map shows when the data was last updated; if the data is stale, the user is warned.
- The user can search for a place or, with their permission, centre the map on their current location. Denying location access does not break the map.
- New incidents and status changes appear without the user having to reload the page, within an agreed delay.
- The public map only shows information intended for the public; it should never expose internal operational data
- If the map or the data source is unavailable, the user sees a clear message instead of an empty or misleading map; showing "no emergencies" when the data is simply missing is not acceptable.

Nota: isto pode ser de mais, as mais cortáveis são provavelmente 6, 11, 14 e 16, que 'são desejáveis mas não essenciais ao MVP'.
Além disso, em diagramas e afins, pode-se contabilizar os agentes no terreno e as fontes externas (e possivelmente o admin???) como atores secundários (ao contrário do resto que seriam atores primários)