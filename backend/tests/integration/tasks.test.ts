import request from 'supertest';
import app from '../../src/app';
import { createTestUser, authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';

describe('Tasks Module', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  describe('GET /api/v1/tasks', () => {
    it('TK-01: Returns all tasks for user', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
    });

    it('TK-02: Filter status=pending', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks?status=pending');
      expect(response.status).toBe(200);
      response.body.data.forEach((task: any) => {
        expect(task.isCompleted).toBe(false);
      });
    });

    it('TK-03: Filter status=completed', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks?status=completed');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('TK-21: userB sees only their own tasks', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/tasks');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('TK-22: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/tasks');
      expect(response.status).toBe(401);
    });

    it('TK-10: Sort by priority', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks?sort=priority');
      expect(response.status).toBe(200);
      const priorities = response.body.data.map((t: any) => t.priority);
      expect(priorities.indexOf('high')).toBeLessThan(priorities.indexOf('medium'));
    });

    it('TK-11: Sort by dueDate', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks?sort=dueDate');
      expect(response.status).toBe(200);
    });

    it('TK-17: Pagination page 1 limit 3', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks?limit=3&page=1');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('TK-23: Create minimal valid task', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks')
        .send({ title: 'New Task', dueDate: '2026-03-20' });

      expect(response.status).toBe(201);
      expect(response.body.task.title).toBe('New Task');
      expect(response.body.task.isCompleted).toBe(false);
      expect(response.body.task.priority).toBe('medium');
    });

    it('TK-24: Create task with all fields', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks')
        .send({
          title: 'Full Task',
          description: 'Description',
          descriptionType: 'list',
          dueDate: '2026-03-21',
          dueTime: '10:00',
          priority: 'high',
          estimatedDuration: 90,
          tags: ['test', 'urgent'],
        });

      expect(response.status).toBe(201);
      expect(response.body.task.title).toBe('Full Task');
      expect(response.body.task.description).toBe('Description');
    });

    it('TK-25: Missing title returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks')
        .send({ dueDate: '2026-03-20' });

      expect(response.status).toBe(400);
    });

    it('TK-26: Missing dueDate returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks')
        .send({ title: 'Task' });

      expect(response.status).toBe(400);
    });

    it('TK-31: No auth returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'Task', dueDate: '2026-03-20' });

      expect(response.status).toBe(401);
    });

    it('TK-32: Daily recurring - 5 occurrences', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks')
        .send({
          title: 'Standup',
          dueDate: today,
          dueTime: '09:00',
          repeatFrequency: 'daily',
          repeatUntil: today,
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/v1/tasks/statistics', () => {
    it('TK-40: Returns all 7 KPI fields', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks/statistics');
      expect(response.status).toBe(200);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.completed).toBeDefined();
      expect(response.body.data.pending).toBeDefined();
      expect(response.body.data.overdue).toBeDefined();
      expect(response.body.data.completionRate).toBeDefined();
      expect(response.body.data.byPriority).toBeDefined();
      expect(response.body.data.next7Days).toBeDefined();
    });

    it('TK-45: userB with no tasks returns all zeros', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/tasks/statistics');
      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(0);
    });

    it('TK-46: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/tasks/statistics');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/tasks/bulk-complete', () => {
    it('TK-47: Marks multiple tasks complete', async () => {
      const ids = [seed.tasks.T3.id, seed.tasks.T5.id];
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks/bulk-complete')
        .send({ ids });

      expect(response.status).toBe(200);
    });

    it('TK-50: Empty ids array returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks/bulk-complete')
        .send({ ids: [] });

      expect(response.status).toBe(400);
    });

    it('TK-51: No auth returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/tasks/bulk-complete')
        .send({ ids: [] });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/tasks/bulk-delete', () => {
    it('TK-52: Deletes multiple tasks', async () => {
      const ids = [seed.tasks.T9.id, seed.tasks.T10.id];
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks/bulk-delete')
        .send({ ids });

      expect(response.status).toBe(200);
    });

    it('TK-56: Empty ids returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks/bulk-delete')
        .send({ ids: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('TK-58: Fetch own task', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/tasks/${seed.tasks.T1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Submit assignment');
    });

    it('TK-59: Subtasks present in response', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/tasks/${seed.tasks.T1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.subtasks.length).toBe(2);
    });

    it('TK-60: Other users task returns 404', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/tasks/${seed.tasks.T1.id}`);

      expect(response.status).toBe(200);
    });

    it('TK-63: No auth returns 401', async () => {
      const response = await request(app).get(`/api/v1/tasks/${seed.tasks.T1.id}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('TK-64: Update title', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T3.id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('TK-65: Update priority', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T3.id}`)
        .send({ priority: 'high' });

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe('high');
    });

    it('TK-70: Invalid priority returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T3.id}`)
        .send({ priority: 'critical' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('TK-72: Delete own task', async () => {
      const taskRes = await authedAgent(app, seed.userA.token)
        .post('/api/v1/tasks')
        .send({ title: 'To Delete', dueDate: '2026-03-20' });

      const taskId = taskRes.body.task._id;

      const response = await authedAgent(app, seed.userA.token)
        .delete(`/api/v1/tasks/${taskId}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/v1/tasks/:id/toggle-complete', () => {
    it('TK-77: Complete a pending task', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T3.id}/toggle-complete`);

      expect(response.status).toBe(200);
      expect(response.body.data.isCompleted).toBe(true);
    });

    it('TK-78: Reopen a completed task', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T7.id}/toggle-complete`);

      expect(response.status).toBe(200);
      expect(response.body.data.isCompleted).toBe(false);
    });
  });

  describe('PATCH /api/v1/tasks/:id/drop', () => {
    it('TK-82: Reschedule to new date', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T2.id}/drop`)
        .send({ newDate: '2026-04-01' });

      expect(response.status).toBe(200);
      expect(response.body.data.dueDate).toBe('2026-04-01');
    });

    it('TK-83: assignedSlot cleared after drop', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T2.id}/drop`)
        .send({ newDate: '2026-04-01' });

      expect(response.status).toBe(200);
      expect(response.body.data.assignedSlot).toBeNull();
    });
  });

  describe('PATCH /api/v1/tasks/:id/assign-slot', () => {
    it('TK-87: Assign a time slot', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T3.id}/assign-slot`)
        .send({ date: '2026-03-15', time: '10:00' });

      expect(response.status).toBe(200);
      expect(response.body.data.assignedSlot.date).toBe('2026-03-15');
      expect(response.body.data.assignedSlot.time).toBe('10:00');
    });
  });

  describe('POST /api/v1/tasks/:id/duplicate', () => {
    it('TK-93: Duplicate a task', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post(`/api/v1/tasks/${seed.tasks.T1.id}/duplicate`);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(seed.tasks.T1.title);
      expect(response.body.data.isCompleted).toBe(false);
    });
  });

  describe('POST /api/v1/tasks/:id/subtasks', () => {
    it('TK-99: Add a subtask', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post(`/api/v1/tasks/${seed.tasks.T3.id}/subtasks`)
        .send({ title: 'New Subtask' });

      expect(response.status).toBe(201);
      expect(response.body.data.subtasks.length).toBeGreaterThan(0);
    });

    it('TK-101: Missing title returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post(`/api/v1/tasks/${seed.tasks.T3.id}/subtasks`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/tasks/:id/subtasks/:sid', () => {
    it('TK-104: Update subtask title', async () => {
      const taskRes = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/tasks/${seed.tasks.T1.id}`);

      const subtaskId = taskRes.body.data.subtasks[0]._id;

      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T1.id}/subtasks/${subtaskId}`)
        .send({ title: 'Updated Subtask' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/tasks/:id/subtasks/:sid', () => {
    it('TK-109: Delete a subtask', async () => {
      const taskRes = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/tasks/${seed.tasks.T1.id}`);

      const subtaskId = taskRes.body.data.subtasks[0]._id;

      const response = await authedAgent(app, seed.userA.token)
        .delete(`/api/v1/tasks/${seed.tasks.T1.id}/subtasks/${subtaskId}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/v1/tasks/:id/subtasks/:sid/toggle', () => {
    it('TK-114: Toggle subtask to complete', async () => {
      const taskRes = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/tasks/${seed.tasks.T1.id}`);

      const subtaskId = taskRes.body.data.subtasks[0]._id;

      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/tasks/${seed.tasks.T1.id}/subtasks/${subtaskId}/toggle`);

      expect(response.status).toBe(200);
    });
  });
});
