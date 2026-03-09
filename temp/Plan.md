# Cortex Task Manager — Node.js Backend Implementation Plan

> Full backend plan for Cortex Task Manager using Node.js + TypeScript with three-layer architecture (Routes → Controllers → Services), MongoDB/Mongoose, and complete per-user data isolation via `createdBy` on every document.

---

## Table of Contents

1. [Phase 1 — Project Foundation](#phase-1--project-foundation)
2. [Phase 2 — Database Models](#phase-2--database-models)
3. [Phase 3 — Shared Utilities](#phase-3--shared-utilities)
4. [Phase 4 — Auth Module](#phase-4--auth-module)
5. [Phase 5 — Tasks Module](#phase-5--tasks-module)
6. [Phase 6 — Todos Module](#phase-6--todos-module)
7. [Phase 7 — Templates Module](#phase-7--templates-module)
8. [Phase 8 — Settings Module](#phase-8--settings-module)
9. [Phase 9 — Scheduler Module](#phase-9--scheduler-module)
10. [Phase 10 — Data Import/Export Module](#phase-10--data-importexport-module)
11. [Phase 11 — Module Router & Final Wiring](#phase-11--module-router--final-wiring)
12. [Phase 12 — Testing](#phase-12--testing)
13. [Files to Create](#files-to-create)
14. [Verification Checklist](#verification-checklist)
15. [Architecture Decisions](#architecture-decisions)

---

## Phase 1 — Project Foundation

**Step 1.** Initialize the project with `npm init -y`, install TypeScript + `ts-node` + `nodemon`, scaffold all folders using the modular monolith structure: `src/config/`, `src/modules/`, `src/database/`, `src/utils/`, `src/types/`.

**Step 2.** Configure `tsconfig.json` with strict mode and path aliases (`@modules/`, `@database/`, `@utils/`, `@config/`). Set up `nodemon.json` to watch `src/**/*.ts`.

**Step 3.** Create `src/config/environment.ts` to validate and export all env vars with Zod:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `PORT` | HTTP server port (default `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `CORS_ORIGIN` | Allowed frontend origin |

**Step 4.** Configure `src/app.ts` with all global middleware:
- `helmet` — secure HTTP headers
- `cors` — whitelist `CORS_ORIGIN`
- `express-mongo-sanitize` — prevent NoSQL injection
- `express.json({ limit: '10mb' })` — body parsing (10 MB to support ICS/JSON imports)
- `morgan` — HTTP logging (development only)
- `compression` — gzip responses
- Rate limiter: `100 req / 15 min` per IP via `express-rate-limit`
- Mount all module routes under `/api/v1`
- 404 handler and global error handler at the end

**Step 5.** Create `src/server.ts` — connect MongoDB first, then start the HTTP server. Handle `uncaughtException` and `unhandledRejection` with graceful shutdown.

---

## Phase 2 — Database Models

### User Model — `src/database/models/user.model.ts`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `name` | `string` | required |
| `email` | `string` | unique, lowercase, required |
| `password` | `string` | `select: false`, bcrypt-hashed |
| `passwordChangedAt` | `Date` | optional |
| `refreshToken` | `string` | `select: false` |
| `settings.theme` | `'light' \| 'dark'` | default `'light'` |
| `settings.availableHours` | `{ start: string, end: string }` | default `{ start: '13:00', end: '22:00' }` |
| `settings.dailyTipIndex` | `{ date: string, index: number }` | optional |
| `settings.recentSearches` | `string[]` | max 5, default `[]` |
| `createdAt` / `updatedAt` | `Date` | timestamps |

- Pre-save hook: bcrypt-hash password when modified (rounds = 12)
- Instance method `comparePassword(candidate)` — bcrypt compare
- Instance method `changedPasswordAfter(jwtTimestamp)` — JWT freshness check
- Index on `email`

---

### Task Model — `src/database/models/task.model.ts`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `createdBy` | `ObjectId (ref: User)` | required, indexed |
| `title` | `string` | required |
| `description` | `string` | optional |
| `descriptionType` | `'text' \| 'list' \| 'chunks'` | default `'text'` |
| `dueDate` | `string` | `YYYY-MM-DD`, required |
| `dueTime` | `string` | `HH:mm`, optional |
| `priority` | `'high' \| 'medium' \| 'low'` | default `'medium'` |
| `estimatedDuration` | `number` | minutes, default `60` |
| `isCompleted` | `boolean` | default `false` |
| `completedAt` | `Date` | optional |
| `assignedSlot` | `{ date: string, time: string } \| null` | default `null` |
| `tags` | `string[]` | default `[]` |
| `repeatFrequency` | `'none' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly'` | default `'none'` |
| `repeatUntil` | `string` | `YYYY-MM-DD`, optional |
| `type` | `string` | optional (e.g. `'ics-import'`) |
| `subtasks` | `Subtask[]` | embedded array |
| `createdAt` / `updatedAt` | `Date` | timestamps |

**Subtask subdocument schema:**

| Field | Type |
|---|---|
| `_id` | `ObjectId` |
| `title` | `string` (required) |
| `isCompleted` | `boolean` (default `false`) |
| `createdAt` | `Date` |

Indexes: `createdBy`, `dueDate`, `isCompleted`, `priority`, `tags`

---

### Todo Model — `src/database/models/todo.model.ts`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `createdBy` | `ObjectId (ref: User)` | required, indexed |
| `order` | `number` | drag-and-drop position, required |
| `title` | `string` | required |
| `description` | `string` | optional |
| `priority` | `'high' \| 'medium' \| 'low'` | default `'medium'` |
| `isCompleted` | `boolean` | default `false` |
| `createdAt` / `updatedAt` | `Date` | timestamps |

Compound index: `(createdBy, order)`

---

### Template Model — `src/database/models/template.model.ts`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Auto |
| `createdBy` | `ObjectId (ref: User)` | indexed |
| `name` | `string` | required |
| `descriptionType` | `'text' \| 'list' \| 'chunks'` | |
| `defaults` | `{ title: string, description: string, descriptionType: string }` | |
| `isSystem` | `boolean` | default `false`; system templates cannot be deleted |
| `createdAt` / `updatedAt` | `Date` | timestamps |

System templates seeded per user on register (not global):

| Name | `descriptionType` | `description` seed |
|---|---|---|
| `Text` | `text` | `''` |
| `List` | `list` | `'- '` |
| `Chunk` | `chunks` | `'[Objective]\n\n[Key Results]\n\n[Context]'` |

---

## Phase 3 — Shared Utilities

**Step 6.** `AppError` (`src/utils/handlers/appError.ts`) — extends `Error` with `statusCode`, `status` (`'fail' | 'error'`), `isOperational: true`.

**Step 7.** `catchAsync` (`src/utils/handlers/catchAsync.ts`) — wraps async Express handlers, forward errors to `next()`.

**Step 8.** `errorHandler` (`src/utils/handlers/errorHandler.ts`) — global Express error middleware. Handles:

| Error Type | HTTP Code |
|---|---|
| Mongoose `ValidationError` | 400 |
| Mongoose `CastError` (invalid ObjectId) | 400 |
| Mongoose duplicate key (`code 11000`) | 409 |
| `JsonWebTokenError` | 401 |
| `TokenExpiredError` | 401 |
| `AppError` | uses `statusCode` |

In development mode, also includes `stack`. Always returns `{ status, message }`.

**Step 9.** `validate` middleware (`src/utils/middleware/validate.middleware.ts`) — Zod-based, validates `body`, `params`, and `query`. Returns `400` with all issues formatted as `[{ field, message }]`.

**Step 10.** `authenticate` middleware (`src/utils/middleware/auth.middleware.ts`) — reads `Authorization: Bearer <token>`, verifies JWT, loads User from DB (excluding password), calls `changedPasswordAfter()`, attaches `req.user`. Returns `401` on any failure.

**Step 11.** `schedulerUtils` (`src/utils/scheduler/schedulerUtils.ts`) — pure TypeScript port of the frontend `Scheduler.jsx` logic (no React, no state):

| Function | Signature | Description |
|---|---|---|
| `findAvailableSlots` | `(task, existingTasks, availableHours, date)` | Scans day within `availableHours` window. For today, starts from current time rounded up to next 30-min mark. Returns `TimeSlot[]`. |
| `suggestOptimalSlots` | `(task, existingTasks, availableHours, maxSuggestions=3)` | Checks next 7 days, scores each slot, returns top N sorted by score. |
| `calculateSlotScore` | `(slot, task, dayOffset)` | Base 100. +20 if high priority before noon. +10 if low priority after 14:00. -5 per day offset. +10 if slot has >30 min extra space. × priority multiplier (high=3, medium=2, low=1). |
| `autoReschedule` | `(task, allTasks, availableHours)` | Picks best slot, returns `{ success, newSlot?, reason }`. |
| `checkConflicts` | `(task, proposedDate, proposedTime, existingTasks)` | Returns array of conflicting tasks. |
| `hasTimeConflict` | `(taskA, taskB)` | Returns `boolean`. |
| `generateRecurringDates` | `(startDate, frequency, repeatUntil)` | Returns `string[]` of `YYYY-MM-DD` dates. |

**Step 12.** `icsParser` (`src/utils/importExport/icsParser.ts`) — lightweight RFC 5545 `.ics` parser (no external library). Maps:

| ICS field | Task field |
|---|---|
| `SUMMARY` | `title` |
| `DESCRIPTION` | `description` |
| `DTSTART` | `dueDate` + `dueTime` |
| `DTEND - DTSTART` | `estimatedDuration` (minutes) |
| `PRIORITY` 1–4 → `high`, 5 → `medium`, 6–9 → `low` | `priority` |
| *(hardcoded)* | `type: 'ics-import'` |
| *(hardcoded)* | `isCompleted: false`, `assignedSlot: null` |

---

## Phase 4 — Auth Module

**Files:** `src/modules/auth/auth.types.ts`, `auth.validator.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`

### Types

```typescript
RegisterInput    { name, email, password, passwordConfirm }
LoginInput       { email, password }
RefreshTokenInput { refreshToken }
JwtPayload       { userId, iat, exp }
AuthResponse     { status, token, refreshToken, data: { user } }
```

### Zod Validators

- `RegisterDTO` — name (2–50 chars), email, password (min 8), passwordConfirm must match password
- `LoginDTO` — email, password (non-empty)
- `RefreshTokenDTO` — refreshToken string

### Service Methods

| Method | Logic |
|---|---|
| `register(data)` | Check email uniqueness (409 if taken), hash password, create User, seed 3 system templates, generate access + refresh tokens, save hashed refreshToken on user |
| `login(data)` | Find user by email (select +password), compare password (401 if wrong), generate tokens, update refreshToken on user |
| `logout(userId)` | Clear `refreshToken` field on user |
| `refreshAccessToken(token)` | Verify with `JWT_REFRESH_SECRET`, load user, check token matches stored hash, issue new accessToken |
| `getMe(userId)` | Find user by id (exclude password + refreshToken) |
| `generateTokens(userId)` | Private: access token (15 min), refresh token (7 d) |

### Routes

```
POST   /api/v1/auth/register        → register
POST   /api/v1/auth/login           → login
POST   /api/v1/auth/logout          → logout         (protected)
POST   /api/v1/auth/refresh-token   → refreshToken
GET    /api/v1/auth/me              → getMe          (protected)
```

---

## Phase 5 — Tasks Module

**Files:** `src/modules/tasks/task.types.ts`, `task.validator.ts`, `task.service.ts`, `task.controller.ts`, `task.routes.ts`

### Types

```typescript
CreateTaskInput   { title, description?, descriptionType?, dueDate, dueTime?,
										priority?, estimatedDuration?, tags?, repeatFrequency?,
										repeatUntil?, subtasks?, type? }

UpdateTaskInput   Partial<CreateTaskInput> & { isCompleted?, assignedSlot?,
										completedAt? }

TaskQuery         { status?, day?, tags?, sort?, search?, page?, limit? }

BulkIdsInput      { ids: string[] }
DropTaskInput     { newDate: string }
AssignSlotInput   { date: string, time: string }
SubtaskInput      { title: string }
```

### Service Methods

All methods are scoped by `createdBy: userId` — users can never read or modify another user's data.

| Method | Logic |
|---|---|
| `findAll(userId, query)` | **Filters:** `status` (pending / completed / overdue), `day` (today / tomorrow / dayAfterTomorrow / thisWeek / thisMonth / all), `tags` (`$all` AND logic), `search` (regex on title + description + tags), `sort` (dueDate asc / priority desc / title asc / latestAdded desc). **Pagination:** default 20/page. Returns `{ tasks, total, totalPages, currentPage }`. |
| `findById(userId, id)` | Guard: throw 404 if not found or `createdBy` doesn't match. |
| `create(userId, data)` | Single task, or batch for recurring (calls `generateRecurringDates()`). Run `hasTimeConflict` check before insert — abort all if any conflict. Returns `{ task }` or `{ tasksAdded, tasks }`. |
| `update(userId, id, updates)` | Find + guard. Re-run conflict check if `dueDate` or `dueTime` changed. `findByIdAndUpdate` with `runValidators: true`. |
| `delete(userId, id)` | Find + guard, delete, return deleted doc. |
| `toggleComplete(userId, id)` | Flip `isCompleted`, set `completedAt = now` on complete, clear on reopen. |
| `bulkComplete(userId, ids[])` | `updateMany({ _id: { $in: ids }, createdBy })` — only affects user's own tasks. |
| `bulkDelete(userId, ids[])` | `deleteMany({ _id: { $in: ids }, createdBy })`. |
| `dropReschedule(userId, id, newDate)` | Update `dueDate`, clear `assignedSlot`. |
| `assignSlot(userId, id, slot)` | Set `assignedSlot: { date, time }`. |
| `addSubtask(userId, id, subtask)` | `$push` to `subtasks`. Auto-assign `_id` and `createdAt`. |
| `updateSubtask(userId, id, sid, updates)` | Positional `$set` on matching subtask. |
| `deleteSubtask(userId, id, sid)` | `$pull` matching subtask. |
| `toggleSubtaskComplete(userId, id, sid)` | Flip `subtasks.$.isCompleted`. |
| `duplicateTask(userId, id)` | Clone doc, new `_id`, `createdAt: now`, `isCompleted: false`, `completedAt: null`, `assignedSlot: null`. |
| `getStatistics(userId)` | Aggregation pipeline — returns: `total`, `completed`, `pending`, `overdue`, `completionRate`, `byPriority: { high, medium, low }`, `next7Days: [{ date, count }]` (for bar chart). |
| `importJSON(userId, json)` | Validate format (version check), insert all tasks with `createdBy`. |
| `importICS(userId, buffer)` | Parse via `icsParser`, insert, skip duplicates by `(title + dueDate + dueTime)`. Returns added count. |

### Routes (all protected)

```
GET    /api/v1/tasks                          getAll (query filters)
POST   /api/v1/tasks                          create (single or recurring)
GET    /api/v1/tasks/statistics               getStatistics
POST   /api/v1/tasks/bulk-complete            bulkComplete
POST   /api/v1/tasks/bulk-delete              bulkDelete
GET    /api/v1/tasks/:id                      findById
PATCH  /api/v1/tasks/:id                      update
DELETE /api/v1/tasks/:id                      delete
PATCH  /api/v1/tasks/:id/toggle-complete      toggleComplete
PATCH  /api/v1/tasks/:id/drop                 dropReschedule
PATCH  /api/v1/tasks/:id/assign-slot          assignSlot
POST   /api/v1/tasks/:id/duplicate            duplicateTask
POST   /api/v1/tasks/:id/subtasks             addSubtask
PATCH  /api/v1/tasks/:id/subtasks/:sid        updateSubtask
DELETE /api/v1/tasks/:id/subtasks/:sid        deleteSubtask
PATCH  /api/v1/tasks/:id/subtasks/:sid/toggle toggleSubtaskComplete
```

---

## Phase 6 — Todos Module

**Files:** `src/modules/todos/todo.types.ts`, `todo.service.ts`, `todo.controller.ts`, `todo.routes.ts`

### Types

```typescript
CreateTodoInput  { title, description?, priority? }
UpdateTodoInput  Partial<CreateTodoInput> & { isCompleted? }
ReorderInput     { activeId: string, overId: string }
```

### Service Methods

| Method | Logic |
|---|---|
| `findAll(userId)` | Sorted by `order` asc, fallback `_id` asc. |
| `findById(userId, id)` | Guard by `createdBy`. |
| `create(userId, data)` | Assign `order` as `(max existing order for user) + 1`. |
| `update(userId, id, updates)` | Find + guard, `findByIdAndUpdate`. |
| `delete(userId, id)` | Find + guard, delete, return deleted doc. |
| `toggleComplete(userId, id)` | Flip `isCompleted`. |
| `reorder(userId, activeId, overId)` | Swap the `order` values of the two todos. |

### Routes (all protected)

```
GET    /api/v1/todos                     findAll
POST   /api/v1/todos                     create
GET    /api/v1/todos/:id                 findById
PATCH  /api/v1/todos/:id                 update
DELETE /api/v1/todos/:id                 delete
PATCH  /api/v1/todos/:id/toggle-complete toggleComplete
PATCH  /api/v1/todos/reorder             reorder
```

---

## Phase 7 — Templates Module

**Files:** `src/modules/templates/template.service.ts`, `template.controller.ts`, `template.routes.ts`

### Service Methods

| Method | Logic |
|---|---|
| `findAll(userId)` | All templates where `createdBy === userId` (includes seeded system ones). |
| `create(userId, data)` | New template with `isSystem: false`. |
| `delete(userId, id)` | Guard by `createdBy`. If `isSystem: true` → throw `403 Forbidden`. |
| `seedSystemTemplates(userId)` | Called internally on register. Creates `Text`, `List`, `Chunk` templates with `isSystem: true`. |

### Routes (all protected)

```
GET    /api/v1/templates      findAll
POST   /api/v1/templates      create
DELETE /api/v1/templates/:id  delete
```

---

## Phase 8 — Settings Module

**Files:** `src/modules/settings/settings.service.ts`, `settings.controller.ts`, `settings.routes.ts`

Settings are embedded on the User document (no separate collection needed).

### Service Methods

| Method | Logic |
|---|---|
| `getSettings(userId)` | Returns `user.settings` object. |
| `updateSettings(userId, patch)` | Partial `$set` on `user.settings.*`. Accepts any subset of `theme`, `availableHours`, `dailyTipIndex`, `recentSearches`. |

### Zod Validator

```typescript
UpdateSettingsDTO {
	theme?:            'light' | 'dark'
	availableHours?:   { start: string, end: string }  // HH:mm
	dailyTipIndex?:    { date: string, index: number }
	recentSearches?:   string[]                         // max 5
}
```

### Routes (all protected)

```
GET   /api/v1/settings   getSettings
PATCH /api/v1/settings   updateSettings
```

---

## Phase 9 — Scheduler Module

**Files:** `src/modules/scheduler/scheduler.service.ts`, `scheduler.controller.ts`, `scheduler.routes.ts`

The service uses `schedulerUtils` (pure functions, no DB writes). The scheduler never mutates data — it only suggests. Accepting a suggestion is done via the Tasks module endpoints (`PATCH /tasks/:id` or `PATCH /tasks/:id/assign-slot`).

### Service Methods

| Method | Logic |
|---|---|
| `suggestSlots(userId, taskId, maxSuggestions?)` | Load task + all other user tasks + `availableHours` from user settings. Call `suggestOptimalSlots()`. Return scored suggestions array. |
| `optimizeUnscheduled(userId)` | Load all pending tasks with no `assignedSlot`. Exclude tasks tagged `lecture`, `section`, `meeting`, `deadline`, `course`. Run `autoReschedule()` per task. Return only suggestions with `score > 70`. |
| `getOverdueSuggestions(userId)` | Load all overdue tasks (`isCompleted: false`, `dueDate < today`). Run `autoReschedule()` per task. Return suggestions. |
| `checkConflicts(userId, taskId, proposedDate, proposedTime)` | Load all user tasks, call `checkConflicts()` util, return conflicting tasks. |

### Routes (all protected)

```
POST /api/v1/scheduler/suggest            suggestSlots
		 body: { taskId, maxSuggestions? }

GET  /api/v1/scheduler/optimize           optimizeUnscheduled
GET  /api/v1/scheduler/overdue            getOverdueSuggestions

POST /api/v1/scheduler/check-conflicts    checkConflicts
		 body: { taskId, proposedDate, proposedTime }
```

---

## Phase 10 — Data Import/Export Module

**Files:** `src/modules/data/data.service.ts`, `data.controller.ts`, `data.routes.ts`

Uses `multer` (memory storage, 5 MB limit) for file uploads with MIME type validation (`.json` / `.ics`).

### Service Methods

| Method | Logic |
|---|---|
| `exportAll(userId)` | Query all tasks + todos for user, get user settings. Returns `{ tasks, todos, settings, exportDate: ISO string, version: '2.0' }` — exactly matching the frontend export format. |
| `importJSON(userId, json)` | Validate JSON format (version + required keys). Delete all existing tasks + todos for user. Bulk insert from JSON with `createdBy: userId`. Return `{ tasksImported, todosImported }`. |
| `importICS(userId, fileBuffer)` | Parse via `icsParser`. Skip tasks that already exist (`title + dueDate + dueTime` match). Bulk insert new tasks with `createdBy: userId`. Return `{ tasksAdded }`. |

### Routes (all protected)

```
GET  /api/v1/data/export        exportAll
POST /api/v1/data/import/json   importJSON   (multipart field: 'data', .json only)
POST /api/v1/data/import/ics    importICS    (multipart field: 'file', .ics only)
```

---

## Phase 11 — Module Router & Final Wiring

`src/modules/index.ts` aggregates all module routers:

```
/auth       →  auth.routes
/tasks      →  task.routes
/todos      →  todo.routes
/templates  →  template.routes
/settings   →  settings.routes
/scheduler  →  scheduler.routes
/data       →  data.routes
```

Mounted in `app.ts` at `/api/v1`.

Additional route: `GET /health` → `{ status: 'ok', timestamp: ISO string }` (no auth required).

---

## Phase 12 — Testing

### Unit Tests

| File | Coverage |
|---|---|
| `tests/unit/schedulerUtils.test.ts` | `findAvailableSlots`, `calculateSlotScore`, `suggestOptimalSlots`, `generateRecurringDates`, `hasTimeConflict`, `autoReschedule` |
| `tests/unit/icsParser.test.ts` | Valid VEVENT parsing, DTSTART/DTEND → duration, PRIORITY mapping, missing fields |

### Integration Tests (Supertest + MongoDB Memory Server)

| Module | Key Scenarios |
|---|---|
| **Auth** | Register creates user + 3 templates; duplicate email returns 409; wrong password returns 401; refresh token round-trip; expired token returns 401 |
| **Tasks** | Full CRUD; recurring batch (5 dates) returns `tasksAdded: 5`; conflict detection blocks overlapping; `bulk-complete` + `bulk-delete`; `statistics` returns all 7 KPI fields; **data isolation**: user B cannot read, update, or delete user A's tasks |
| **Todos** | Full CRUD; `reorder` swaps order values correctly; data isolation |
| **Templates** | CRUD; system templates seeded on register; deleting `isSystem: true` returns 403; data isolation |
| **Settings** | `getSettings` returns defaults; partial `updateSettings` does not overwrite unpatched fields |
| **Scheduler** | `suggestSlots` returns sorted scored suggestions; `optimize` skips excluded tags; results are empty for user with no tasks |
| **Data** | JSON export → re-import round-trip produces identical task/todo counts; ICS import second run adds 0 duplicates; 5 MB file size limit enforced |

---

## Files to Create

```
src/
├── config/
│   └── environment.ts
├── app.ts
├── server.ts
├── database/
│   ├── connection.ts
│   └── models/
│       ├── user.model.ts
│       ├── task.model.ts
│       ├── todo.model.ts
│       ├── template.model.ts
│       └── index.ts
├── utils/
│   ├── handlers/
│   │   ├── appError.ts
│   │   ├── catchAsync.ts
│   │   └── errorHandler.ts
│   ├── middleware/
│   │   ├── validate.middleware.ts
│   │   └── auth.middleware.ts
│   ├── scheduler/
│   │   └── schedulerUtils.ts
│   └── importExport/
│       └── icsParser.ts
├── modules/
│   ├── index.ts
│   ├── auth/
│   │   ├── auth.types.ts
│   │   ├── auth.validator.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   ├── tasks/
│   │   ├── task.types.ts
│   │   ├── task.validator.ts
│   │   ├── task.service.ts
│   │   ├── task.controller.ts
│   │   └── task.routes.ts
│   ├── todos/
│   │   ├── todo.types.ts
│   │   ├── todo.service.ts
│   │   ├── todo.controller.ts
│   │   └── todo.routes.ts
│   ├── templates/
│   │   ├── template.service.ts
│   │   ├── template.controller.ts
│   │   └── template.routes.ts
│   ├── settings/
│   │   ├── settings.service.ts
│   │   ├── settings.controller.ts
│   │   └── settings.routes.ts
│   ├── scheduler/
│   │   ├── scheduler.service.ts
│   │   ├── scheduler.controller.ts
│   │   └── scheduler.routes.ts
│   └── data/
│       ├── data.service.ts
│       ├── data.controller.ts
│       └── data.routes.ts
└── types/
		└── express.d.ts           ← augment req.user: IUser

tests/
├── unit/
│   ├── schedulerUtils.test.ts
│   └── icsParser.test.ts
└── integration/
		├── auth.test.ts
		├── tasks.test.ts
		├── todos.test.ts
		├── templates.test.ts
		├── settings.test.ts
		├── scheduler.test.ts
		└── data.test.ts
```

---

## Verification Checklist

- [ ] `GET /health` → `200 { status: 'ok' }`
- [ ] `POST /api/v1/auth/register` → creates user, seeds 3 templates, returns JWT pair
- [ ] `POST /api/v1/auth/login` with wrong password → `401`
- [ ] `POST /api/v1/auth/refresh-token` with valid refresh token → new access token
- [ ] `POST /api/v1/tasks` with `repeatFrequency: 'daily'` and `repeatUntil` 5 days out → `{ tasksAdded: 5 }`
- [ ] `POST /api/v1/tasks` with time conflict → `409` with conflicting task info
- [ ] `GET /api/v1/tasks?status=pending&day=today&tags=deadline` → filtered, user-scoped results
- [ ] `GET /api/v1/tasks/statistics` → `{ total, completed, pending, overdue, completionRate, byPriority, next7Days }`
- [ ] `POST /api/v1/tasks/bulk-delete` with ids from another user → `0 deleted`, original tasks untouched
- [ ] `DELETE /api/v1/templates/:id` where `isSystem: true` → `403`
- [ ] `GET /api/v1/scheduler/optimize` → excludes `lecture`, `section`, `meeting`, `deadline`, `course` tagged tasks
- [ ] `POST /api/v1/data/import/ics` with valid `.ics` → tasks created; second import → `tasksAdded: 0`
- [ ] `GET /api/v1/data/export` → JSON matches `{ tasks, todos, settings, exportDate, version: '2.0' }`
- [ ] All unit tests pass: `npm test`
- [ ] Data isolation test: user B cannot fetch user A's tasks.

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Database | MongoDB + Mongoose | JSON-like documents map naturally to task/todo shapes; matches guide |
| Auth tokens | Short-lived JWT access (15 min) + refresh (7 d) stored hashed on User | No cookie dependency; frontend uses `Authorization: Bearer` |
| Subtasks | Embedded subdocuments on Task | No join needed; matches current frontend model exactly |
| Tags | `string[]` on Task — no separate collection | Exact match to frontend; tags are never queried independently |
| System templates | Seeded per-user on register with `isSystem: true` | Users can't affect each other; deletion blocked at service layer |
| Scheduler logic | Pure functions in `schedulerUtils.ts` | Identical scoring algorithm to frontend; easily unit-testable; no side effects |
| ICS parsing | Custom lightweight parser | No heavy library dependency; mirrors frontend `importICS` exactly |
| Settings | Embedded on User document | Avoids extra collection + join; matches current k/v IndexedDB model |
| **Excluded** | WebSocket sync, push notifications, haptics, audio | Browser-only features — not applicable server-side |

