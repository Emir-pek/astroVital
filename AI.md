# AI Usage Disclosure — AstroVital

NASA Space Apps permits AI tools but asks teams to clearly indicate **where and how** AI was used
([Project Submission Guide → Use of Artificial Intelligence](https://www.spaceappschallenge.org/resources/project-submission-guide/)).
This file is that disclosure. It is kept up to date by the team (see "Maintaining this file").

## Summary

| Question                                          | Answer                                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Did we use AI tools to prepare the project?       | **Yes** — Anthropic Claude (Claude Code CLI, Claude desktop/web app, claude.ai Projects)                              |
| Does the AstroVital app itself use AI at runtime? | **No.** No machine-learning model, no LLM, no network calls. Assessment is a deterministic, source-cited rules engine |
| Who is responsible for the result?                | The four team members. Every AI-assisted change is reviewed by a human in a pull request and must pass CI             |

## Where AI was used

| Area                   | How AI helped                                                                                                                                                                                                   | Human control                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Code                   | Scaffolding, React/TypeScript components, tests, refactors, lint/type fixes                                                                                                                                     | PR review + 1 approval; CI (`lint`, `typecheck`, tests, build) must be green                               |
| Astronaut illustration | Claude wrote the SVG drawing code of the Status-screen astronaut (pose, shading, suit detail) as React components. No image-generation model, no raster images, no external assets, no agency logos or insignia | Reviewed by eye in the browser against the UI design spec (§8); anchors and region shapes covered by tests |
| Research               | Finding NASA/CSA/ESA sources, summarising the NASA HRP hazards and risks, drafting the source list                                                                                                              | Thresholds use only cited sources (`docs/SOURCES.md`); unverified ones are marked                          |
| Documentation          | Drafting README, setup guides, architecture notes, decision records, changelog entries                                                                                                                          | Reviewed and edited by the team                                                                            |
| Team tooling           | Setup scripts, CI workflow, git hooks, shared Claude configuration                                                                                                                                              | Owned by the tooling owner; changes go through PRs                                                         |
| Anomaly-detection tool | Python code of the offline tool in `tools/anomaly-detection/` (synthetic data generator, personal-baseline detector, evaluation script) and its refactor into modules; analysis of results                 | Outputs checked against fixed-seed reference runs (byte-identical after refactors); thresholds marked PLACEHOLDER until sourced |
| Demo material (if any) | Script and subtitle drafts                                                                                                                                                                                      | Final wording by the team; AI images/video watermarked (see below)                                         |

## How AI was used

- **Rules for the assistant** live in the repository: `CLAUDE.md` (architecture, code style, medical
  accuracy, offline-first), module `CLAUDE.md` files and `.claude/rules/ai-collaboration.md`
  (communication style: understand first, ask before solving, objective, trade-offs).
- **No invented medical numbers.** Every threshold and recommendation links to a source ID
  (`src/core/config/sources.config.ts` ↔ `docs/SOURCES.md`). AI may draft; a person checks the source.
- **Synthetic data only.** All crew data is simulated (seeded generator); no real health data was
  given to any AI tool. The offline anomaly-detection tool derives its templates from MMASH, a public,
  anonymised research dataset (PhysioNet, ODbL); it contains no data of any team member or astronaut.
- **Traceability.** AI-assisted commits carry a `Co-Authored-By: Claude …` trailer in the commit
  message (git metadata), and AI-generated pull requests say so in their description. Every change
  is also summarised in `CHANGELOG.md`.

## Content-specific rules we follow

- **Images and videos:** any AI-generated image or video carries a visible "AI-generated" watermark.
  The in-app astronaut figure is vector code written with AI assistance (see the table), not output of
  an image model; it is disclosed here and in the commit metadata.
- **Audio:** AI-generated audio is acknowledged in descriptive text and metadata.
- **Code and data:** acknowledged in descriptive text (this file) and metadata (commit trailers).
- **NASA branding:** AI-generated content does not use, contain or modify NASA logos or design elements.

## Maintaining this file

Update this file in the same pull request whenever AI is used in a new way (new tool, AI-generated
asset, AI in the app). The `document-change` skill lists it among the files to check.
