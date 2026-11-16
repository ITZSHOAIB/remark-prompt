# Roadmap: remark-prompt 0.1.0

Implementation scope, acceptance criteria and slice sequencing live in the GitHub epics below. This file is the navigation map; keep execution details in the issues.

All eight epics are triaged in GitHub with `epic`, `triaged`, a priority label, and milestone `0.1.0`. Priority means: **P0** is foundational work that blocks the delivery path; **P1** is a high-priority release gate or core capability; **P2** is required 0.1.0 work that follows a prerequisite. Native blocked-by links are the cross-epic source of truth; the issue body contains slice dependencies and acceptance checks.

## Wave 1 · Foundations

- **P0** · [Epic 1: Core architecture and output contract](https://github.com/ITZSHOAIB/remark-prompt/issues/2)
- **P1** · [Epic 2: Contributor experience](https://github.com/ITZSHOAIB/remark-prompt/issues/3) — repository safeguards can start independently; contributor guides follow Epic 1.

## Wave 2 · Product capabilities (after Epic 1)

- **P1** · [Epic 3: Host fidelity and integration verification](https://github.com/ITZSHOAIB/remark-prompt/issues/4)
- **P1** · [Epic 4: Service configuration and prompt handoff](https://github.com/ITZSHOAIB/remark-prompt/issues/5)
- **P2** · [Epic 5: Authoring safety and diagnostics](https://github.com/ITZSHOAIB/remark-prompt/issues/6) — follows Epic 4 service support.
- **P2** · [Epic 6: Accessible reader experience](https://github.com/ITZSHOAIB/remark-prompt/issues/7) — follows Epic 3 browser coverage and Epic 4 handoff behavior.

## Wave 3 · Demo and release

- **P2** · [Epic 7: Multi-host demo site](https://github.com/ITZSHOAIB/remark-prompt/issues/8) — follows Epic 3 fixtures.
- **P1** · [Epic 8: Release and launch](https://github.com/ITZSHOAIB/remark-prompt/issues/9) — follows the implementation and demo work; its slices also cover post-release trusted publishing and launch drafts.

Each epic is one issue with checklist slices. Native blocked-by relationships show the epic-level gates; slice-level ordering and acceptance checks are written in the epic body. A slice becomes a sub-issue only when separate discussion or outside ownership makes that useful.

The product scope and rationale remain in [the PRD](prd.md); lasting technical decisions remain in [the ADRs](adr/).
