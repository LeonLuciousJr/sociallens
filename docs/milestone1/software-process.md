# Milestone 1: Software Process

SocialLens uses an **iterative, incremental process**, as established in the [root README](../../README.md). Each milestone delivers an increment; implementation and integration feedback refine that increment before submission. This document extends that rationale without replacing the existing Definition of Done.

## Workflow

1. **Select scope from the backlog.** Prioritize the account, publishing, feed, and interaction stories needed for an end-to-end MVP. Record current milestone scope separately from the longer-term backlog; comments are excluded from Milestone 1.
2. **Define boundaries.** Use the [API contract](../design/api-contract.md), [use cases](../requirements/use-cases.md), and [architecture ADR](../architecture/adr-001-modular.monolith.md) to guide frontend/backend feature work.
3. **Implement in feature branches.** Keep React presentation and API adaptation separate from Django views, services, repositories, and models.
4. **Integrate through pull requests.** Reconcile actual payloads, authentication, media handling, and feed behavior. The repository includes merged frontend, backend-fix, and integration pull requests; integration exposed differences between the planned contract and running implementation.
5. **Verify before merging.** The Definition of Done calls for local execution, tests or manual checks, preservation of passing checks, and review. Relevant checks include frontend API tests, lint/build, and real API/database flows. Merge history alone does not prove that every check or feature passed.
6. **Use feedback for the next iteration.** Retest fixes and document unresolved limitations rather than treating an implemented screen as evidence of a working end-to-end feature.

## Justification

Small increments make interface problems visible early and keep the essential user flow ahead of optional features. The API boundary supports separate frontend and backend development, while a dedicated integration step catches assumptions that isolated tests miss. The modular monolith keeps deployment and debugging manageable within the course schedule.

This approach also permits scope adjustment without discarding useful work: comments were removed while accounts, posts, feeds, likes, and follows remained central. The [implementation scope](product-brief-and-scope.md) distinguishes current capabilities from remaining integration limitations.
