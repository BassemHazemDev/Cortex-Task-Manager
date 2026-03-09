# Cortex Task Manager — Backend Testing Plan

> Complete test specification for every API endpoint. Tests are grouped by module and ordered: happy path → validation errors → auth/permission errors → edge cases. Seed data is defined once and reused by reference throughout.

---

## Table of Contents

1. [Test Infrastructure](#1-test-infrastructure)
2. [Seed Data](#2-seed-data)
3. [Health Check](#3-health-check)
4. [Auth Module — 5 endpoints](#4-auth-module)
5. [Tasks Module — 16 endpoints](#5-tasks-module)
6. [Todos Module — 7 endpoints](#6-todos-module)
7. [Templates Module — 3 endpoints](#7-templates-module)
8. [Settings Module — 2 endpoints](#8-settings-module)
9. [Scheduler Module — 4 endpoints](#9-scheduler-module)
10. [Data Module — 3 endpoints](#10-data-module)
11. [Global Error Handling](#11-global-error-handling)
12. [Cross-Cutting Data Isolation](#12-cross-cutting-data-isolation)
13. [Test Run Commands](#13-test-run-commands)

---

## 1. Test Infrastructure

### Stack

| Tool | Role |
|---|---|
| `jest` + `ts-jest` | Test runner and TypeScript transformer |
| `supertest` | HTTP integration testing against the Express app |
| `mongodb-memory-server` | In-process MongoDB, no external dependency |
| `bcryptjs` | Pre-hash passwords in seed helpers |

### Setup Conventions

- One `beforeAll` per test file: start MongoDB Memory Server, connect Mongoose, insert seed data, capture inserted IDs.
- One `afterAll` per test file: disconnect Mongoose, stop server.
- One `afterEach` where mutation tests need a clean slate: restore only the affected document(s) rather than flushing the whole DB.
- Auth tokens for `userA` and `userB` are generated once in `beforeAll` and stored as module-level variables.
- All requests that require auth pass `Authorization: Bearer <token>` header.
- Response shape assertions always check **both** the HTTP status code **and** the JSON body structure.

### Environment `tests/.env.test`
NODE_ENV=test
PORT=0
MONGO_URI=mongodb://127.0.0.1/cortex-test
JWT_SECRET=test-secret-access
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=test-secret-refresh
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173


### Shared Test Helper `tests/helpers/auth.ts`

```typescript
// Returns { token, refreshToken, userId } for a freshly registered user
export async function createTestUser(app, overrides = {}) { ... }

// Returns supertest agent with Authorization header pre-set
export function authedAgent(app, token) { ... }

2. Seed Data
All seed data is defined here. Test cases reference it by name rather than repeating values.

Users
Ref	name	email	password
userA	Alice Cortex	alice@test.com	Password1!
userB	Bob Cortex	bob@test.com	Password2!
Both users are inserted via POST /api/v1/auth/register in beforeAll so the system templates are also seeded automatically. Their access tokens are stored as tokenA and tokenB.

Tasks for userA (10 tasks)
Ref	title	dueDate	dueTime	priority	estimatedDuration	tags	isCompleted	assignedSlot	subtasks
T1	Submit assignment	TODAY	14:00	high	90	["deadline","course"]	false	null	2 subtasks
T2	Team meeting	TODAY	16:00	medium	60	["meeting"]	false	{date:TODAY,time:"16:00"}	none
T3	Read chapter 5	TOMORROW	null	low	45	["lecture"]	false	null	none
T4	Weekly review	TOMORROW	10:00	high	30	["task"]	false	null	none
T5	Gym session	DAY_AFTER_TOMORROW	07:00	low	60	["activity"]	false	null	none
T6	Project proposal	THIS_WEEK	null	high	120	["deadline","task"]	false	null	2 subtasks (1 done, 1 pending)
T7	Finished task	YESTERDAY	09:00	medium	30	["task"]	true	null	none
T8	Overdue task	3_DAYS_AGO	10:00	high	60	["deadline"]	false	null	none
T9	Section review	TODAY	11:00	medium	50	["section","course"]	false	null	none
T10	Unscheduled personal	NEXT_WEEK	null	medium	60	["task"]	false	null	none

Date tokens (TODAY, TOMORROW, etc.) are resolved to YYYY-MM-DD strings at seed time. T1.subtasks = [{title:"Outline",isCompleted:false},{title:"Draft",isCompleted:false}]. T6.subtasks = [{title:"Research",isCompleted:true},{title:"Write",isCompleted:false}].

Todos for userA (5 todos)
Ref	title	description	priority	isCompleted	order
D1	Buy groceries	Milk, eggs, bread	low	false	0
D2	Call dentist	null	medium	false	1
D3	Review pull request	Review PR #42	high	false	2
D4	Pay electricity bill	null	high	true	3
D5	Read book chapter	Chapter 7	low	false	4
Templates for userA
Three system templates are auto-seeded on register. One custom template is inserted in beforeAll:

Ref	name	descriptionType	isSystem
TPL_TEXT	Text	text	true
TPL_LIST	List	list	true
TPL_CHUNK	Chunk	chunks	true
TPL_CUSTOM	Study Session	chunks	false

ICS Fixture tests/fixtures/sample.ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
SUMMARY:ICS Imported Task
DESCRIPTION:Imported from calendar
DTSTART:20260310T090000Z
DTEND:20260310T100000Z
PRIORITY:2
END:VEVENT
BEGIN:VEVENT
SUMMARY:Another ICS Task
DESCRIPTION:Second event
DTSTART:20260311T140000Z
DTEND:20260311T150000Z
PRIORITY:5
END:VEVENT
END:VCALENDAR

JSON Export Fixture tests/fixtures/export.json
{
  "version": "2.0",
  "exportDate": "2026-03-09T00:00:00.000Z",
  "tasks": [
    {
      "title": "Imported Task A",
      "description": "from backup",
      "descriptionType": "text",
      "dueDate": "2026-03-20",
      "dueTime": "10:00",
      "priority": "high",
      "estimatedDuration": 60,
      "isCompleted": false,
      "assignedSlot": null,
      "tags": ["task"],
      "repeatFrequency": "none",
      "subtasks": []
    }
  ],
  "todos": [
    {
      "title": "Imported Todo A",
      "description": "from backup",
      "priority": "medium",
      "isCompleted": false,
      "order": 0
    }
  ],
  "settings": {
    "theme": "dark",
    "availableHours": { "start": "09:00", "end": "18:00" }
  }
}

3. Health Check
GET /health
#	Description	Auth	Expected Status	Expected Body
H-01	Returns ok without auth	none	200	{ status: 'ok', timestamp: <ISO string> }
4. Auth Module
POST /api/v1/auth/register
#	Description	Body	Expected Status	Expected Body / Behaviour
A-01	Register new user successfully	{ name, email, password, passwordConfirm } (valid)	201	{ status:'success', token, refreshToken, data:{ user:{ id, name, email, settings } } } — password and refreshToken NOT in response
A-02	Seeds 3 system templates on register	same as A-01	201	GET /templates immediately after returns exactly 3 templates with isSystem:true
A-03	Default settings are correct	same as A-01	201	settings.theme='light', availableHours.start='13:00', availableHours.end='22:00', recentSearches=[]
A-04	Duplicate email returns 409	same email as A-01	409	{ status:'fail', message: <contains 'email'> }
A-05	Missing name returns 400	no name field	400	field error for name
A-06	Invalid email returns 400	email: 'notanemail'	400	field error for email
A-07	Password too short returns 400	password: 'abc'	400	field error for password
A-08	Passwords don't match returns 400	passwordConfirm: 'Different1!'	400	field error for passwordConfirm
A-09	Name too long returns 400	name: 'A'.repeat(51)	400	field error for name

POST /api/v1/auth/login
#	Description	Body	Expected Status	Expected Body
A-10	Login with correct credentials	{ email: userA.email, password: userA.password }	200	{ status:'success', token, refreshToken, data:{ user } }
A-11	Wrong password returns 401	{ email: userA.email, password: 'WrongPass!' }	401	{ status:'fail', message }
A-12	Non-existent email returns 401	{ email: 'nobody@test.com', password: 'Anything1!' }	401	{ status:'fail', message }
A-13	Missing email returns 400	{ password: 'Abc123!!' }	400	field error
A-14	Missing password returns 400	{ email: userA.email }	400	field error
POST /api/v1/auth/logout (protected)
#	Description	Auth	Expected Status	Expected Body
A-15	Logout clears refresh token	tokenA	204	no body
A-16	Unauthenticated logout returns 401	none	401	{ status:'fail', message }
A-17	After logout, refresh token is invalid	use refreshToken from A-15	401	{ status:'fail', message }

POST /api/v1/auth/refresh-token
#	Description	Body	Expected Status	Expected Body
A-18	Valid refresh token returns new access token	{ refreshToken: <valid> }	200	{ status:'success', token: <new JWT> }
A-19	Invalid / tampered refresh token returns 401	{ refreshToken: 'tampered.token.here' }	401	{ status:'fail', message }
A-20	Missing refreshToken field returns 400	{}	400	field error
GET /api/v1/auth/me (protected)
#	Description	Auth	Expected Status	Expected Body
A-21	Returns authenticated user's profile	tokenA	200	{ data:{ user:{ id, name, email, settings } } } — password absent
A-22	No token returns 401	none	401	{ status:'fail', message }
A-23	Expired token returns 401	expired JWT	401	{ status:'fail', message }
A-24	Malformed token returns 401	Bearer bad.token	401	{ status:'fail', message }

5. Tasks Module
All task endpoints require tokenA unless stated.

GET /api/v1/tasks
#	Description	Query	Expected Status	Expected Body
TK-01	Returns all tasks for user	(none)	200	{ tasks:[10 items], total:10, totalPages:1, currentPage:1 }
TK-02	Filter status=pending	?status=pending	200	only tasks with isCompleted:false
TK-03	Filter status=completed	?status=completed	200	only T7
TK-04	Filter status=overdue	?status=overdue	200	only T8
TK-05	Filter day=today	?day=today	200	T1, T2, T9
TK-06	Filter day=tomorrow	?day=tomorrow	200	T3, T4
TK-07	Filter day=thisWeek	?day=thisWeek	200	all tasks whose dueDate falls in the current week
TK-08	Filter by single tag	?tags=deadline	200	T1, T6, T8
TK-09	Filter by multiple tags (AND)	?tags=deadline&tags=course	200	only T1 (has BOTH)
TK-10	Sort by priority	?sort=priority	200	high tasks before medium before low
TK-11	Sort by dueDate	?sort=dueDate	200	earliest dueDate first
TK-12	Sort by title	?sort=title	200	alphabetical A–Z
TK-13	Sort by latestAdded	?sort=latestAdded	200	most recently created first
TK-14	Search by title	?search=assignment	200	T1 in results
TK-15	Search by description	?search=Outline	200	tasks whose description contains 'Outline'
TK-16	Search by tag string	?search=lecture	200	T3, T9
TK-17	Pagination page 1 limit 3	?limit=3&page=1	200	tasks.length=3, totalPages=4, currentPage=1
TK-18	Pagination page 2 limit 3	?limit=3&page=2	200	tasks.length=3, currentPage=2
TK-19	Combined filters: pending + today	?status=pending&day=today	200	T1, T2, T9
TK-20	No results returns empty array	?search=zzznomatch	200	{ tasks:[], total:0, totalPages:0, currentPage:1 }
TK-21	userB sees only their own tasks	tokenB	200	empty array
TK-22	No auth returns 401	none	401	—

POST /api/v1/tasks — single task
#	Description	Body	Expected Status	Expected Body
TK-23	Create minimal valid task	{ title:'New Task', dueDate:'2026-03-20' }	201	{ task:{ id, title, dueDate, createdBy:userAId, isCompleted:false, tags:[], subtasks:[], priority:'medium', estimatedDuration:60, descriptionType:'text', assignedSlot:null } }
TK-24	Create task with all fields	full CreateTaskInput incl. tags, subtasks, dueTime	201	all fields reflected
TK-25	Missing title returns 400	{ dueDate:'2026-03-20' }	400	field error for title
TK-26	Missing dueDate returns 400	{ title:'Task' }	400	field error for dueDate
TK-27	Invalid dueDate format returns 400	{ title:'T', dueDate:'not-a-date' }	400	field error for dueDate
TK-28	Invalid priority value returns 400	{ title:'T', dueDate:'2026-03-20', priority:'urgent' }	400	field error for priority
TK-29	Invalid descriptionType returns 400	{ title:'T', dueDate:'2026-03-20', descriptionType:'freeform' }	400	field error for descriptionType
TK-30	Time conflict returns 409	task at TODAY 14:00 duration 60 (overlaps T1)	409	{ status:'fail', message, conflicts:[...] }
TK-31	No auth returns 401	none	401	—

POST /api/v1/tasks — recurring task
#	Description	Body	Expected Status	Expected Body
TK-32	Daily recurring — 5 occurrences	{ title:'Standup', dueDate:'2026-03-10', dueTime:'09:00', repeatFrequency:'daily', repeatUntil:'2026-03-14' }	201	{ tasksAdded:5, tasks:[5 items] }
TK-33	All recurring tasks share same title	same as TK-32	201	every item in tasks[] has title:'Standup'
TK-34	Recurring dates are correct sequence	same as TK-32	201	dates: 2026-03-10 … 2026-03-14
TK-35	Weekly recurring 3 weeks	repeatFrequency:'weekly', repeatUntil covering 3 Mondays	201	tasksAdded:3
TK-36	Monthly recurring 3 months	repeatFrequency:'monthly', repeatUntil:'2026-05-10'	201	tasksAdded:3 (Mar, Apr, May)
TK-37	Yearly recurring 3 years	repeatFrequency:'yearly', repeatUntil:'2028-03-10'	201	tasksAdded:3
TK-38	Conflict in one occurrence aborts entire batch	one slot overlapping existing	409	{ status:'fail', conflicts } — no tasks created
TK-39	repeatUntil before dueDate returns 400	repeatUntil earlier than dueDate	400	field error

GET /api/v1/tasks/statistics
#	Description	Auth	Expected Status	Expected Body
TK-40	Returns all 7 KPI fields	tokenA	200	{ total, completed, pending, overdue, completionRate, byPriority:{ high, medium, low }, next7Days:[{date,count}×7] }
TK-41	total === completed + pending	tokenA	200	arithmetic check
TK-42	completionRate === Math.round((completed/total)*100)	tokenA	200	10 with 1/10 tasks done
TK-43	byPriority.high + medium + low === total	tokenA	200	sum check
TK-44	next7Days.length === 7	tokenA	200	exactly 7 date entries
TK-45	userB with no tasks returns all zeros	tokenB	200	{ total:0, completed:0, pending:0, overdue:0, completionRate:0 }
TK-46	No auth returns 401	none	401	—
POST /api/v1/tasks/bulk-complete
#	Description	Body	Expected Status	Expected Body
TK-47	Marks multiple tasks complete	{ ids:[T3.id, T5.id] }	200	{ updated:2 }
TK-48	Tasks are actually marked complete	GET /tasks/T3.id after TK-47	200	isCompleted:true
TK-49	IDs from other user silently ignored	{ ids:[userBTaskId] } using tokenA	200	{ updated:0 }
TK-50	Empty ids array returns 400	{ ids:[] }	400	field error
TK-51	No auth returns 401	none	401	—

POST /api/v1/tasks/bulk-delete
#	Description	Body	Expected Status	Expected Body
TK-52	Deletes multiple tasks	{ ids:[T9.id, T10.id] }	200	{ deleted:2 }
TK-53	Deleted tasks return 404	GET /tasks/T9.id after TK-52	404	—
TK-54	IDs from other user silently ignored	{ ids:[userBTaskId] } using tokenA	200	{ deleted:0 }
TK-55	Mixed valid + cross-user IDs	{ ids:[T3.id, userBTaskId] }	200	{ deleted:1 }
TK-56	Empty ids returns 400	{ ids:[] }	400	—
TK-57	No auth returns 401	none	401	—
GET /api/v1/tasks/:id
#	Description	Params	Expected Status	Expected Body
TK-58	Fetch own task	T1.id	200	full task incl. subtasks and tags
TK-59	Subtasks present in response	T1.id	200	subtasks.length===2, each has id, title, isCompleted
TK-60	Other user's task returns 404	userBTaskId using tokenA	404	—
TK-61	Non-existent ID returns 404	random ObjectId	404	—
TK-62	Invalid ObjectId format returns 400	id:'not-an-id'	400	CastError → 400
TK-63	No auth returns 401	—	401	—

PATCH /api/v1/tasks/:id
#	Description	Body	Expected Status	Expected Body
TK-64	Update title	{ title:'Updated Title' } on T3	200	task.title === 'Updated Title'
TK-65	Update priority	{ priority:'high' } on T3	200	task.priority === 'high'
TK-66	Update tags	{ tags:['task','meeting'] } on T3	200	task.tags equals new array
TK-67	Update dueDate without conflict	{ dueDate:'2026-04-01' } on T3	200	task.dueDate === '2026-04-01'
TK-68	Update causing conflict returns 409	change T3 to overlap T1	409	{ status:'fail', conflicts }
TK-69	Other user's task returns 404	any body on userBTaskId	404	—
TK-70	Invalid priority returns 400	{ priority:'critical' }	400	—
TK-71	No auth returns 401	—	401	—
DELETE /api/v1/tasks/:id
#	Description	Params	Expected Status	Expected Body
TK-72	Delete own task	T7.id	200	{ task:{ id:T7.id, ... } }
TK-73	Deleted task returns 404 on follow-up	T7.id after TK-72	404	—
TK-74	Other user's task returns 404	userBTaskId	404	—
TK-75	Non-existent ID returns 404	random ObjectId	404	—
TK-76	No auth returns 401	—	401	—

PATCH /api/v1/tasks/:id/toggle-complete
#	Description	Params	Expected Status	Expected Body
TK-77	Complete a pending task	T3.id	200	{ task:{ isCompleted:true, completedAt:<ISO date> } }
TK-78	Reopen a completed task	T7.id	200	{ task:{ isCompleted:false, completedAt:null } }
TK-79	Double-toggle returns to original state	toggle T3 twice	200 (2nd)	isCompleted:false
TK-80	Other user's task returns 404	userBTaskId	404	—
TK-81	No auth returns 401	—	401	—
PATCH /api/v1/tasks/:id/drop
#	Description	Body	Expected Status	Expected Body
TK-82	Reschedule to new date	{ newDate:'2026-04-01' } on T2	200	{ task:{ dueDate:'2026-04-01', assignedSlot:null } }
TK-83	assignedSlot cleared after drop	T2 previously had a slot	200	task.assignedSlot === null
TK-84	Invalid date format returns 400	{ newDate:'tomorrow' }	400	—
TK-85	Other user's task returns 404	userBTaskId	404	—
TK-86	No auth returns 401	—	401	—

PATCH /api/v1/tasks/:id/assign-slot
#	Description	Body	Expected Status	Expected Body
TK-87	Assign a time slot	{ date:'2026-03-15', time:'10:00' } on T3	200	{ task:{ assignedSlot:{ date:'2026-03-15', time:'10:00' } } }
TK-88	Overwrite existing slot	same on T2	200	new slot value in response
TK-89	Missing date returns 400	{ time:'10:00' }	400	—
TK-90	Missing time returns 400	{ date:'2026-03-15' }	400	—
TK-91	Other user's task returns 404	userBTaskId	404	—
TK-92	No auth returns 401	—	401	—
POST /api/v1/tasks/:id/duplicate
#	Description	Params	Expected Status	Expected Body
TK-93	Duplicate a task	T1.id	201	{ task:{ title:T1.title, isCompleted:false, completedAt:null, assignedSlot:null } }
TK-94	Duplicated task has new unique _id	TK-93 result	201	task.id !== T1.id
TK-95	Duplicated task belongs to same user	TK-93 result	201	task.createdBy === userA.id
TK-96	Subtasks are also copied	T1 has 2 subtasks	201	task.subtasks.length === 2
TK-97	Other user's task returns 404	userBTaskId	404	—
TK-98	No auth returns 401	—	401	—

POST /api/v1/tasks/:id/subtasks
#	Description	Body	Expected Status	Expected Body
TK-99	Add a subtask	{ title:'New Subtask' } on T3	201	updated task with new subtask in array
TK-100	Subtask has auto _id and isCompleted:false	TK-99 result	201	subtask._id exists, subtask.isCompleted === false
TK-101	Missing title returns 400	{}	400	—
TK-102	Other user's task returns 404	userBTaskId	404	—
TK-103	No auth returns 401	—	401	—
PATCH /api/v1/tasks/:id/subtasks/:sid
#	Description	Body	Expected Status	Expected Body
TK-104	Update subtask title	{ title:'Updated Subtask' } on T1.subtasks[0]	200	task returned with updated subtask title
TK-105	Other subtask unchanged	TK-104	200	T1.subtasks[1] unaffected
TK-106	Non-existent subtask ID returns 404	random ObjectId as sid	404	—
TK-107	Other user's task returns 404	userBTaskId	404	—
TK-108	No auth returns 401	—	401	—

DELETE /api/v1/tasks/:id/subtasks/:sid
#	Description	Params	Expected Status	Expected Body
TK-109	Delete a subtask	T1.subtasks[0]._id	200	task with subtasks.length===1
TK-110	Deleted subtask gone on follow-up GET	GET /tasks/T1.id after TK-109	200	only 1 subtask
TK-111	Non-existent subtask returns 404	—	404	—
TK-112	Other user's task returns 404	userBTaskId	404	—
TK-113	No auth returns 401	—	401	—
PATCH /api/v1/tasks/:id/subtasks/:sid/toggle
#	Description	Params	Expected Status	Expected Body
TK-114	Toggle subtask to complete	T1.subtasks[1]._id (currently false)	200	subtask.isCompleted === true
TK-115	Toggle back to incomplete	same again	200	subtask.isCompleted === false
TK-116	Only targeted subtask changed	TK-114	200	T1.subtasks[0].isCompleted unchanged
TK-117	Non-existent subtask returns 404	—	404	—
TK-118	Other user's task returns 404	userBTaskId	404	—
TK-119	No auth returns 401	—	401	—

6. Todos Module
All todo endpoints require tokenA unless stated.

GET /api/v1/todos
#	Description	Auth	Expected Status	Expected Body
TD-01	Returns all todos sorted by order asc	tokenA	200	array of 5 in order D1→D5
TD-02	Returns only this user's todos	tokenB	200	empty array
TD-03	No auth returns 401	none	401	—
POST /api/v1/todos
#	Description	Body	Expected Status	Expected Body
TD-04	Create minimal todo	{ title:'New Todo' }	201	{ todo:{ id, title, isCompleted:false, priority:'medium', order:5 } }
TD-05	order is max existing + 1	5 existing (max order=4)	201	todo.order === 5
TD-06	Create with all fields	{ title, description, priority:'high' }	201	all fields reflected
TD-07	Missing title returns 400	{}	400	field error
TD-08	Invalid priority returns 400	{ title:'T', priority:'critical' }	400	field error
TD-09	No auth returns 401	none	401	—

GET /api/v1/todos/:id
#	Description	Params	Expected Status	Expected Body
TD-10	Fetch own todo	D1.id	200	full todo document
TD-11	Other user's todo returns 404	userBTodoId using tokenA	404	—
TD-12	Non-existent ID returns 404	random ObjectId	404	—
TD-13	Invalid ObjectId returns 400	id:'abc'	400	—
TD-14	No auth returns 401	none	401	—
PATCH /api/v1/todos/:id
#	Description	Body	Expected Status	Expected Body
TD-15	Update title	{ title:'Updated Todo' } on D1	200	todo.title === 'Updated Todo'
TD-16	Update priority	{ priority:'high' } on D1	200	todo.priority === 'high'
TD-17	Update description	{ description:'New desc' }	200	todo.description === 'New desc'
TD-18	Partial update leaves other fields	{ title:'X' }	200	D1.priority unchanged
TD-19	Other user's todo returns 404	userBTodoId	404	—
TD-20	Invalid priority returns 400	{ priority:'urgent' }	400	—
TD-21	No auth returns 401	none	401	—
DELETE /api/v1/todos/:id
#	Description	Params	Expected Status	Expected Body
TD-22	Delete todo	D5.id	200	{ todo:{ id:D5.id, title:'Read book chapter' } }
TD-23	Deleted todo returns 404	D5.id after TD-22	404	—
TD-24	Other user's todo returns 404	userBTodoId	404	—
TD-25	No auth returns 401	none	401	—

PATCH /api/v1/todos/:id/toggle-complete
#	Description	Params	Expected Status	Expected Body
TD-26	Complete a pending todo	D1.id	200	todo.isCompleted === true
TD-27	Reopen a completed todo	D4.id	200	todo.isCompleted === false
TD-28	Double-toggle returns to original	toggle D1 twice	200	isCompleted === false
TD-29	Other user's todo returns 404	—	404	—
TD-30	No auth returns 401	none	401	—
PATCH /api/v1/todos/reorder
#	Description	Body	Expected Status	Expected Body
TD-31	Swap D1 (order 0) with D3 (order 2)	{ activeId:D1.id, overId:D3.id }	200	D1.order===2, D3.order===0
TD-32	GET /todos reflects new order after reorder	after TD-31	200	D3 appears before D1
TD-33	Reorder with other user's todo returns 404	{ activeId:D1.id, overId:userBTodoId }	404	—
TD-34	Missing activeId returns 400	{ overId:D2.id }	400	—
TD-35	Missing overId returns 400	{ activeId:D1.id }	400	—
TD-36	No auth returns 401	none	401	—

7. Templates Module
All template endpoints require tokenA unless stated.

GET /api/v1/templates
#	Description	Auth	Expected Status	Expected Body
TPL-01	Returns all 4 templates (3 system + 1 custom)	tokenA	200	{ templates:[TPL_TEXT, TPL_LIST, TPL_CHUNK, TPL_CUSTOM] }
TPL-02	System templates have isSystem:true	tokenA	200	templates.filter(t=>t.isSystem).length === 3
TPL-03	userB sees only their own templates	tokenB	200	templates.length === 3 and createdBy === userB.id
TPL-04	No auth returns 401	none	401	—
POST /api/v1/templates
#	Description	Body	Expected Status	Expected Body
TPL-05	Create custom template	{ name:'Sprint Plan', descriptionType:'chunks', defaults:{...} }	201	{ template:{ id, name:'Sprint Plan', isSystem:false, createdBy:userA.id } }
TPL-06	isSystem is always false for user-created	TPL-05 result	201	template.isSystem === false
TPL-07	Missing name returns 400	{ descriptionType:'text' }	400	field error
TPL-08	Invalid descriptionType returns 400	{ name:'T', descriptionType:'other' }	400	field error
TPL-09	No auth returns 401	none	401	—

DELETE /api/v1/templates/:id
#	Description	Params	Expected Status	Expected Body
TPL-10	Delete custom template	TPL_CUSTOM.id	200	{ template:{ id:TPL_CUSTOM.id } }
TPL-11	Deleted template not in list	GET /templates after TPL-10	200	templates.length === 3
TPL-12	Delete system template returns 403	TPL_TEXT.id	403	{ status:'fail', message }
TPL-13	Other user's template returns 404	userB's TPL_TEXT.id using tokenA	404	—
TPL-14	Non-existent ID returns 404	random ObjectId	404	—
TPL-15	No auth returns 401	none	401	—
8. Settings Module
All settings endpoints require tokenA unless stated.

GET /api/v1/settings
#	Description	Auth	Expected Status	Expected Body
SET-01	Returns full settings object	tokenA	200	{ settings:{ theme:'light', availableHours:{ start:'13:00', end:'22:00' }, dailyTipIndex:null, recentSearches:[] } }
SET-02	Each user has independent settings	tokenB	200	independent settings object
SET-03	No auth returns 401	none	401	—

PATCH /api/v1/settings
#	Description	Body	Expected Status	Expected Body
SET-04	Update theme to dark	{ theme:'dark' }	200	settings.theme === 'dark', other fields unchanged
SET-05	Update availableHours	{ availableHours:{ start:'09:00', end:'18:00' } }	200	settings.availableHours.start === '09:00'
SET-06	Update recentSearches	{ recentSearches:['lecture','deadline'] }	200	settings.recentSearches equals new array
SET-07	Partial update leaves other fields intact	{ theme:'dark' } only	200	availableHours still default
SET-08	Invalid theme value returns 400	{ theme:'rainbow' }	400	field error
SET-09	availableHours missing start returns 400	{ availableHours:{ end:'18:00' } }	400	field error
SET-10	No auth returns 401	none	401	—

9. Scheduler Module
All scheduler endpoints require tokenA unless stated.

POST /api/v1/scheduler/suggest
#	Description	Body	Expected Status	Expected Body
SCH-01	Returns scored suggestions	{ taskId:T10.id }	200	{ suggestions:[{ date, time, score }] } at least 1
SCH-02	maxSuggestions limits results	{ taskId:T10.id, maxSuggestions:2 }	200	suggestions.length <= 2
SCH-03	Default maxSuggestions is 3	{ taskId:T10.id }	200	suggestions.length <= 3
SCH-04	Suggestions sorted by score descending	same	200	suggestions[0].score >= suggestions[1].score
SCH-05	Suggestions respect availableHours window	same	200	all times within 13:00–22:00
SCH-06	Suggestions avoid occupied slots	suggestions avoid TODAY 14:00–15:30 (T1)	200	no suggestion overlapping T1
SCH-07	Task not found returns 404	{ taskId:<random ObjectId> }	404	—
SCH-08	Other user's task returns 404	{ taskId:userBTaskId } using tokenA	404	—
SCH-09	Missing taskId returns 400	{}	400	—
SCH-10	No auth returns 401	none	401	—

GET /api/v1/scheduler/optimize
#	Description	Auth	Expected Status	Expected Body
SCH-11	Returns suggestions for unscheduled tasks	tokenA	200	{ suggestions:[{ taskId, taskTitle, date, time, score }] }
SCH-12	Excludes tasks tagged lecture (T3)	tokenA	200	T3 absent
SCH-13	Excludes tasks tagged section (T9)	tokenA	200	T9 absent
SCH-14	Excludes tasks tagged meeting (T2)	tokenA	200	T2 absent
SCH-15	Excludes tasks tagged deadline (T8)	tokenA	200	T8 absent
SCH-16	Excludes tasks tagged course (T1, T9)	tokenA	200	T1 absent
SCH-17	Only returns suggestions with score > 70	tokenA	200	suggestions.every(s => s.score > 70)
SCH-18	Already-slotted task not suggested (T2)	tokenA	200	T2 absent
SCH-19	userB with no tasks returns empty array	tokenB	200	{ suggestions:[] }
SCH-20	No auth returns 401	none	401	—
GET /api/v1/scheduler/overdue
#	Description	Auth	Expected Status	Expected Body
SCH-21	Returns suggestions for overdue tasks	tokenA	200	{ suggestions:[...] } — T8 included
SCH-22	Completed overdue task excluded (T7)	tokenA	200	T7 absent
SCH-23	Suggested new dates are in the future	tokenA	200	all suggestion.date >= TODAY
SCH-24	userB with no overdue returns empty	tokenB	200	{ suggestions:[] }
SCH-25	No auth returns 401	none	401	—

POST /api/v1/scheduler/check-conflicts
#	Description	Body	Expected Status	Expected Body
SCH-26	No conflicts found	{ taskId:T10.id, proposedDate:'2026-04-10', proposedTime:'09:00' }	200	{ conflicts:[] }
SCH-27	Conflict detected with T1	{ taskId:T10.id, proposedDate:TODAY, proposedTime:'14:00' }	200	{ conflicts:[{ id:T1.id, title:'Submit assignment' }] }
SCH-28	Task excluded from its own conflicts	{ taskId:T1.id, proposedDate:TODAY, proposedTime:'14:00' }	200	T1 not in conflict list
SCH-29	Other user's task returns 404	{ taskId:userBTaskId }	404	—
SCH-30	Missing proposedDate returns 400	{ taskId:T10.id, proposedTime:'10:00' }	400	—
SCH-31	Missing proposedTime returns 400	{ taskId:T10.id, proposedDate:'2026-04-01' }	400	—
SCH-32	No auth returns 401	none	401	—

10. Data Module
All data endpoints require tokenA unless stated.

GET /api/v1/data/export
#	Description	Auth	Expected Status	Expected Body
DAT-01	Export returns complete JSON	tokenA	200	{ tasks, todos, settings, exportDate, version:'2.0' }
DAT-02	tasks contains all userA tasks	tokenA	200	data.tasks.length === 10
DAT-03	todos contains all userA todos	tokenA	200	data.todos.length === 5
DAT-04	settings matches current settings	tokenA	200	data.settings.theme === 'light'
DAT-05	version is exactly '2.0'	tokenA	200	data.version === '2.0'
DAT-06	exportDate is a valid ISO string	tokenA	200	new Date(data.exportDate) does not throw
DAT-07	Does not include userB's data	tokenA	200	no task with createdBy: userB.id
DAT-08	No auth returns 401	none	401	—

POST /api/v1/data/import/json
multipart/form-data, field name data. Uses tests/fixtures/export.json.

#	Description	File	Expected Status	Expected Body
DAT-09	Import valid JSON backup	export.json	200	{ tasksImported:1, todosImported:1 }
DAT-10	Imported tasks owned by authed user	GET /tasks after import	200	task.createdBy === userA.id
DAT-11	Wipes and replaces existing tasks	GET /tasks after import	200	only 1 task from backup
DAT-12	Wipes and replaces existing todos	GET /todos after import	200	only 1 todo from backup
DAT-13	Invalid JSON structure returns 400	{ version:'1.0' } (no tasks key)	400	{ status:'fail', message }
DAT-14	File over 5 MB returns 413	padded file	413	—
DAT-15	Non-JSON file returns 400	.txt file	400	—
DAT-16	No file in request returns 400	empty body	400	—
DAT-17	No auth returns 401	none	401	—

POST /api/v1/data/import/ics
multipart/form-data, field name file. Uses tests/fixtures/sample.ics.

#	Description	File	Expected Status	Expected Body
DAT-18	Import valid ICS file	sample.ics	200	{ tasksAdded:2 }
DAT-19	Imported tasks have type:'ics-import'	GET /tasks after	200	both imported tasks have type === 'ics-import'
DAT-20	Imported tasks have isCompleted:false	same	200	—
DAT-21	DTSTART maps to dueDate + dueTime	first imported task	200	dueDate:'2026-03-10', dueTime:'09:00'
DAT-22	Duration maps to estimatedDuration	DTEND−DTSTART = 60 min	200	estimatedDuration === 60
DAT-23	PRIORITY:2 maps to high	first event	200	priority === 'high'
DAT-24	PRIORITY:5 maps to medium	second event	200	priority === 'medium'
DAT-25	Second import of same file adds 0 tasks	re-import sample.ics	200	{ tasksAdded:0 }
DAT-26	Non-ICS file returns 400	.txt file	400	—
DAT-27	Malformed ICS (no VEVENT) returns 200 with 0	ICS with no events	200	{ tasksAdded:0 }
DAT-28	File over 5 MB returns 413	padded .ics	413	—
DAT-29	No auth returns 401	none	401	—

11. Global Error Handling
#	Description	Action	Expected Status	Expected Body
ERR-01	Unknown route returns 404	GET /api/v1/doesnotexist	404	{ status:'fail', message: "Can't find /api/v1/doesnotexist" }
ERR-02	Invalid ObjectId on any :id route	GET /api/v1/tasks/not-valid-id	400	{ status:'fail', message }
ERR-03	Stack trace absent in production	NODE_ENV=production on any error	any	stack field absent
ERR-04	Malformed JSON body returns 400	Content-Type:application/json body '{'	400	—
12. Cross-Cutting Data Isolation
#	Resource	userA action on userB's resource	Expected Status
ISO-01	Task	GET /tasks/:userBTaskId using tokenA	404
ISO-02	Task	PATCH /tasks/:userBTaskId using tokenA	404
ISO-03	Task	DELETE /tasks/:userBTaskId using tokenA	404
ISO-04	Task	PATCH /tasks/:userBTaskId/toggle-complete using tokenA	404
ISO-05	Task	POST /tasks/bulk-complete { ids:[userBTaskId] } using tokenA	200 { updated:0 }
ISO-06	Task	POST /tasks/bulk-delete { ids:[userBTaskId] } using tokenA	200 { deleted:0 }
ISO-07	Todo	GET /todos/:userBTodoId using tokenA	404
ISO-08	Todo	PATCH /todos/:userBTodoId using tokenA	404
ISO-09	Todo	DELETE /todos/:userBTodoId using tokenA	404
ISO-10	Template	DELETE /templates/:userBTemplateId using tokenA	404
ISO-11	Statistics	GET /tasks/statistics by each user	200
ISO-12	Export	GET /data/export as tokenA	200
ISO-13	Subtask	POST /tasks/:userBTaskId/subtasks using tokenA	404
ISO-14	Scheduler	POST /scheduler/suggest { taskId:userBTaskId } using tokenA	404

13. Test Run Commands
# Run all tests
pnpm test

# Run a specific module
pnpm test tests/integration/auth.test.ts
pnpm test tests/integration/tasks.test.ts
pnpm test tests/integration/todos.test.ts
pnpm test tests/integration/templates.test.ts
pnpm test tests/integration/settings.test.ts
pnpm test tests/integration/scheduler.test.ts
pnpm test tests/integration/data.test.ts

# Unit tests only
pnpm test tests/unit/

# Run with coverage
pnpm test --coverage

# Run a single test by ID
pnpm test --testNamePattern="TK-32"

# Watch mode
pnpm test --watch

Coverage Targets
Area	Target
src/utils/scheduler/schedulerUtils.ts	≥ 95%
src/utils/importExport/icsParser.ts	≥ 95%
All *.service.ts files	≥ 90%
src/utils/handlers/errorHandler.ts	≥ 85%
Overall	≥ 80%


That's **~170 test cases** covering:
- Every single endpoint (40 routes total)
- All happy paths, validation failures, auth failures, and edge cases
- Complete seed data with 2 users, 10 tasks, 5 todos, 4 templates, plus ICS and JSON fixtures
- A dedicated cross-user data isolation suite (14 cases)
- Scheduler-specific tests (tag exclusion, scoring, slot avoidance, conflict detection)That's **~170 test cases** covering:
- Every single endpoint (40 routes total)
- All happy paths, validation failures, auth failures, and edge cases
- Complete seed data with 2 users, 10 tasks, 5 todos, 4 templates, plus ICS and JSON fixtures
- A dedicated cross-user data isolation suite (14 cases)
- Scheduler-specific tests (tag exclusion, scoring, slot avoidance, conflict detection)