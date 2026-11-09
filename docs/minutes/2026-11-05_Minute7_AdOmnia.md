# Ad Omnia - Minute #7

## Participants

- Bernardo Reis 126004
- Diogo Silva 125240
- Fernando Santos 124808
- Guilherme Martins 125260
- Miguel Neto 125200

## Date and Time

The meeting took place on 05/11/2026 at 18:15.

## Agenda

- AI implementation;
- Plugin types;
- Public/private architecture;
- Communication between the private and public APIs;
- Work review.

## Discussion and Decisions

### AI Implementation

The team discussed how AI would be implemented in the platform and how the different types of AI functionality should be divided between the core system and the organizations' plugins.

**Decision:** General-purpose prediction systems will be part of the core AI Service. More specific services, such as action recommendations and domain-specific predictions, will be implemented in the organizations' plugins.

### Plugin Types

The team discussed which kinds of extensions the plugin system should support.

**Decision:** There will be three types of plugins: data sources, UI, and features.

### Public/Private Architecture

The team discussed how far the separation between the public and private parts of the architecture should go. Decoupling their deployments prevents excessive load on the public application from causing a denial of service on the private application.

**Decision:** The public and private architectures will be fully separated, with independent deployments. Dedicated diagrams and documentation will be produced for the public architecture.

### Communication Between the Private and Public APIs

Since the public API is read-only, the private side needs a way to write data to the public database. The team explored possible approaches, with a message broker being the initial idea.

**Decision:** No decision was made. The approach will be chosen at a later meeting.

### Work Review

The team reviewed the work done so far and went over what still needs to be done.
