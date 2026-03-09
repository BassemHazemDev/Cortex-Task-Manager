# Backend Testing Plan

## Purpose
Provide a complete test plan that verifies every backend endpoint, business rule, and integration point described in the implementation plan. Includes seed data fixtures and recommended test structure (unit, integration, and e2e where appropriate).

## Test Environment
- Node: use project's supported Node version
- Test runner: `jest` with `ts-jest`
- HTTP assertions: `supertest`
- DB: `mongodb-memory-server` for integration tests
- Mocks: use Jest mocks for external services (email, analytics)
- Run command: `npm run test` (configure scripts accordingly)

## Test Structure
- `tests/unit/` — service-level unit tests (pure functions, business logic)
- `tests/integration/` — HTTP + DB integration tests using Supertest + mongodb-memory-server
- `tests/fixtures/` — JSON fixtures and ICS files for imports/exports
- `tests/helpers/` — test utilities (createUser, getAuthToken, seedDB, clearDB)

## Seed Data (fixtures)
- Users (fixtures/users.json)
  - user_admin: { email: "admin@local", password: "AdminPass123", role: "admin" }
  - user_alice: { email: "alice@local", password: "AlicePass123", role: "user" }

- Projects (fixtures/projects.json)
  - project_default (owner: alice)

- Tasks (fixtures/tasks.json) — 30 tasks distributed:
  - 10 one-off tasks (various due dates: past, today, future)
  - 8 recurring tasks (daily, weekly, monthly, every-other-day)
  - 6 tasks with subtasks (2–6 subtasks each) with mixed completed states
  - 6 tasks assigned to `project_default`, mixed priorities and estimated durations

- Todos (fixtures/todos.json) — 50 todos with tags, due dates, completed flags

- Templates (fixtures/templates.json) — 6 templates representing common task groups

- ICS fixtures (fixtures/calendar_sample.ics) — calendar with 12 events that map to tasks

Notes: keep fixture sizes moderate to keep tests fast; use helper to build heavier data when needed.

## Auth & Test Helpers
- `tests/helpers/createUser(email, password, role)` — creates user and returns credentials
- `tests/helpers/getAuthToken(email, password)` — logs in and returns JWT access token
- `tests/helpers/seedDB(fixtures)` — loads fixture arrays into mongodb-memory-server
- `tests/helpers/clearDB()` — clears collections between tests

## Per-Endpoint Test Matrix

### Auth: `/auth`
- POST /auth/register
  - success: valid email/password → 201 + user created (no password in response)
  - validation: missing/invalid email/password → 400 with validation errors
  - duplicate email → 409 conflict

- POST /auth/login
  - success: correct credentials → 200 + accessToken + refreshToken
  - invalid credentials → 401
  - locked/inactive user → 403

- POST /auth/refresh
  - success: valid refresh token → 200 + new access token
  - expired/invalid token → 401

- POST /auth/logout
  - success: revoke refresh token → 200
  - missing token → 400

Tests: unit tests for token utilities and integration tests for auth routes including token storage & revocation.

### Tasks: `/tasks`
- GET /tasks
  - success: returns list filtered by owner, project, tag, date ranges
  - auth: unauthorized access → 401
  - pagination & sorting work as expected

- POST /tasks
  - success: valid task → 201 with created resource
  - validation: missing required fields (title) → 400
  - permission: cannot create task for another user/project without access → 403

- GET /tasks/:id
  - success: returns task with embedded subtasks
  - not found → 404
  - ownership check → 403 when accessing others' private tasks

- PUT /tasks/:id
  - success: updates fields (title, dueDate, recurrence) → 200 and persisted
  - invalid update (bad recurrence rule) → 400
  - concurrent updates: optimistic locking or last-write-wins — test race by sequential patched requests

- DELETE /tasks/:id
  - success: soft-delete or hard-delete per design → 204
  - cascading: subtasks deleted/archived accordingly

- POST /tasks/:id/complete
  - mark task completed → 200, subtasks handled as specified

Tests: unit tests for recurrence expansion, priority scoring; integration tests for full CRUD plus edge cases.

### Todos: `/todos`
- GET /todos — filtered by list, dueDate, completed
- POST /todos — create quick todo, validation errors
- PUT /todos/:id — toggle complete, edit title
- DELETE /todos/:id — remove item
Edge cases: ordering when multiple users update list, offline created-timestamp ordering

### Templates: `/templates`
- CRUD operations for templates
- Applying a template to create tasks/todos — idempotency tests (applying twice creates duplicates vs blocks as designed)

### Import/Export: `/import`, `/export`
- POST /import (JSON)
  - success: valid JSON v2.0 → 200 and imported objects with mapping validation
  - malformed JSON → 400
  - duplicate ids handling (skip/merge) → behavior-specific tests

- POST /import (ICS)
  - success: sample ICS parsed → tasks/events created with correct times & recurrence
  - invalid ICS → 400 with parse errors

- GET /export (JSON)
  - returns user's data in v2.0 format with expected keys

- GET /export (ICS)
  - returns ICS stream with VEVENTs matching user's tasks

Fixtures: `calendar_sample.ics`, example exported JSON

### Settings & Meta
- GET/PUT /settings — test read & update operations, validation of schema
- GET /meta and GET /health — simple availability checks, DB connectivity responses

### Edge Cases & Non-functional Tests
- Rate limiting: exceed request rate → expect 429
- Security headers: ensure `helmet` supplied headers exist in responses
- Input sanitization: send MongoDB operator payloads to ensure `express-mongo-sanitize` blocks them
- Large payloads: test file/ICS upload size limits
- Performance: basic benchmark tests for listing endpoints with 1k items (optional smoke)

## Test Coverage Goals
- Unit coverage: 80%+ for services and utils
- Integration: cover all API routes with happy & common unhappy paths

## CI Integration
- Add GitHub Actions job: `test` step running `npm ci && npm run test -- --coverage`
- Fail on coverage drop below threshold

## Running Locally
Install and run tests locally:

```bash
pnpm install
pnpm test
```

Or with npm:

```bash
npm ci
npm run test
```

## Next Actions
1. Persist `tests/helpers` and fixtures into `tests/fixtures/`.
2. Scaffold core integration tests for `auth` and `tasks` using `mongodb-memory-server`.
3. Iterate on coverage and expand endpoint-specific tests.

---
_Testing plan created by assistant._
