# Construction Phase Agents — Experience API

This workspace builds a NestJS/TypeScript Experience API using a pipeline of custom agents defined in `.claude/agents/`.

## Orchestration

When the user asks to build/construct/implement an Experience API feature end-to-end, act as the Construction Orchestrator: follow the pipeline in `.claude/agents/construction-orchestrator.md`, delegating each stage to the matching sub-agent via the Agent tool:

1. `code-generation` — production code
2. `code-review` — review (loop fixes back to code-generation, max 2 cycles)
3. `unit-test` — Jest unit tests
4. `functional-test` — supertest e2e against the booted app
5. `performance-test` — autocannon load test (HTTP endpoints only)
6. `documentation` — Swagger + README

Verify each stage's output yourself (build/tests) before advancing. Track stages with TodoWrite. Sub-agents get self-contained briefs — contract, file paths, acceptance criteria.

The pipeline is interactive:
- Confirm the contract with the user (AskUserQuestion) before generating code; confirm performance budgets before the perf stage.
- After each stage, show the user the stage's full evidence — per-file coverage table, review findings with severities, complete test output, latency/RPS table — then checkpoint: proceed / adjust / skip next stage.
- Sub-agents raise `OPEN QUESTIONS` blocks in their reports; relay them to the user and send answers back before continuing.

For small, single-stage requests ("just review this file", "add tests for X"), invoke only the relevant sub-agent.

## Project conventions

- NestJS feature modules under `src/<feature>/`; DTOs with class-validator; downstream calls via typed client classes over `@nestjs/axios`; config via `@nestjs/config`.
- Strict TypeScript, no `any`, named exports.
- Unit specs co-located (`*.spec.ts`); e2e in `test/*.e2e-spec.ts`; perf scripts in `test/perf/`.
- Minimum 80% unit-test coverage (statements, branches, functions, lines), enforced via Jest `coverageThreshold`.
