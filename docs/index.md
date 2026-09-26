---
template: home.html
title: Home
hide:
  - navigation
  - toc
---

<!--
  Secção "Arquitetura (rascunho)" retirada daqui — vai passar para uma
  página própria. Fica o código Mermaid guardado como exemplo para
  reaproveitar nesse ficheiro:

  ## Arquitetura (rascunho) { #arquitetura }

  <div class="ad-card ad-arch-card" markdown="1">

  ```mermaid
  flowchart LR
      APIs[APIs externas] --> DBF[(DB Fast)]
      DBF <--> Core
      DBF --> AI
      Plugins <--> Core
      AI <--> Core
      Core <--> DBM[(DB Main)]
      Core <--> Proxy
      Proxy <--> Frontend
  ```

  </div>
-->
