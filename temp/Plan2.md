<!-- Backend Implementation Plan for Cortex Task Manager -->
# Backend Implementation Plan

## Objective
Deliver a robust Node.js + TypeScript backend (Express + Mongoose) that provides authentication, task/todo management, templates, settings, scheduler utilities, and import/export endpoints matching the frontend requirements.

## Phases
- Phase 1 — Project Foundation (done)
- Phase 2 — Database Models
- Phase 3 — Shared Utilities
- Phase 4 — Auth Module
- Phase 5 — Tasks Module
- Phase 6 — Todos Module
- Phase 7 — Templates Module
- Phase 8 — Settings Module
- Phase 9 — Scheduler Module
- Phase 10 — Data Import/Export Module
- Phase 11 — Module Router & Final Wiring
- Phase 12 — Testing
- Documentation & Verification

## Key Decisions
- Language: TypeScript
- DB: MongoDB + Mongoose models
- Auth: JWT (access + refresh), bcrypt for passwords
- Validation: Zod for env and request validation
- Testing: Jest + ts-jest, Supertest, mongodb-memory-server
- Security: helmet, cors, rate-limiter, express-mongo-sanitize

## Core Models (files)
- `models/user.model.ts` — users, roles, tokens
- `models/task.model.ts` — tasks, recurrence, subtasks
- `models/todo.model.ts` — lightweight todos for quick lists
- `models/template.model.ts` — saved task/todo templates

## Modules & Structure (per module)
- Each module: `*.service.ts`, `*.controller.ts`, `*.routes.ts`, `*.types.ts`, `*.tests.ts`
- Modules: `auth`, `tasks`, `todos`, `templates`, `settings`, `scheduler`, `data` (import/export)

## Shared Utilities
- `utils/AppError.ts`, `utils/catchAsync.ts`, `utils/validate.ts`
- `middleware/authenticate.ts`, `middleware/errorHandler.ts`, `middleware/validateRequest.ts`
- `utils/schedulerUtils.ts` — scoring/priority logic ported from frontend
- `utils/icsParser.ts` — ICS import/export helpers (RFC 5545)

## Endpoints (high-level)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET/POST/PUT/DELETE /tasks` (+ `/tasks/:id/complete`, `/tasks/:id/subtasks`)
- `GET/POST/PUT/DELETE /todos`
- `GET/POST/PUT/DELETE /templates`
- `GET/POST /export` (JSON, ICS), `POST /import` (JSON, ICS)
- `GET/health`, `GET/meta` for diagnostics

## Testing & Seed Data
- Use `mongodb-memory-server` for fast integration tests
- Auth helpers to generate JWTs and seeded users
- Create fixture seed data: 2 users (admin/user), 5 projects, 30 tasks with varied recurrence and subtasks, 50 todos, 6 templates
- Tests: unit tests for services + integration tests for all HTTP endpoints using Supertest (cover happy path, validation errors, auth/permission cases, concurrency where applicable)

## Dev & Ops
- Environment config via Zod; keep dev/test/prod parity
- Add `npm` scripts: `build`, `start`, `dev`, `test`, `test:watch`, `lint`, `format`
- Logging: `morgan` in dev; structured logs in prod

## Deliverables
- `src/` backend package with above modules
- `tests/` with unit + integration suites and fixtures
- `backend/TestingPlan.md` (detailed per-endpoint tests & seed fixtures)
- README section with run/test instructions

## Next Steps (short)
1. Scaffold models and shared utilities (Phase 2–3).
2. Implement Auth module and basic routes (Phase 4).
3. Implement Tasks/Todos/Templates (Phase 5–7).
4. Add import/export and scheduler utilities (Phase 9–10).
5. Write comprehensive tests and seed data (Phase 12).

---
_Plan created by assistant on behalf of the project team._
