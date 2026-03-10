import request from 'supertest';
import app from '../../src/app';
import { authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';

describe('Todos Module', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  describe('GET /api/v1/todos', () => {
    it('TD-01: Returns all todos sorted by order asc', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/todos');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(5);
    });

    it('TD-02: Returns only this users todos', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/todos');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('TD-03: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/todos');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/todos', () => {
    it('TD-04: Create minimal todo', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/todos')
        .send({ title: 'New Todo' });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('New Todo');
      expect(response.body.data.isCompleted).toBe(false);
    });

    it('TD-06: Create with all fields', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/todos')
        .send({
          title: 'Full Todo',
          description: 'Description',
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.priority).toBe('high');
    });

    it('TD-07: Missing title returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/todos')
        .send({});

      expect(response.status).toBe(400);
    });

    it('TD-08: Invalid priority returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/todos')
        .send({ title: 'T', priority: 'critical' });

      expect(response.status).toBe(400);
    });

    it('TD-09: No auth returns 401', async () => {
      const response = await request(app).post('/api/v1/todos').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/todos/:id', () => {
    it('TD-10: Fetch own todo', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .get(`/api/v1/todos/${seed.todos.D1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Buy groceries');
    });

    it('TD-11: Other users todo returns 404', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .get('/api/v1/todos/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });

    it('TD-14: No auth returns 401', async () => {
      const response = await request(app).get(`/api/v1/todos/${seed.todos.D1.id}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/todos/:id', () => {
    it('TD-15: Update title', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/todos/${seed.todos.D1.id}`)
        .send({ title: 'Updated Todo' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Todo');
    });

    it('TD-16: Update priority', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/todos/${seed.todos.D1.id}`)
        .send({ priority: 'high' });

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe('high');
    });

    it('TD-17: Update description', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/todos/${seed.todos.D1.id}`)
        .send({ description: 'New desc' });

      expect(response.status).toBe(200);
    });

    it('TD-20: Invalid priority returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/todos/${seed.todos.D1.id}`)
        .send({ priority: 'urgent' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/todos/:id', () => {
    it('TD-22: Delete todo', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .delete(`/api/v1/todos/${seed.todos.D5.id}`);

      expect(response.status).toBe(200);
    });

    it('TD-24: Other users todo returns 404', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .delete('/api/v1/todos/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/todos/:id/toggle-complete', () => {
    it('TD-26: Complete a pending todo', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/todos/${seed.todos.D1.id}/toggle-complete`);

      expect(response.status).toBe(200);
      expect(response.body.data.isCompleted).toBe(true);
    });

    it('TD-27: Reopen a completed todo', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch(`/api/v1/todos/${seed.todos.D4.id}/toggle-complete`);

      expect(response.status).toBe(200);
      expect(response.body.data.isCompleted).toBe(false);
    });
  });

  describe('PATCH /api/v1/todos/reorder', () => {
    it('TD-31: Swap order values', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/todos/reorder')
        .send({ activeId: seed.todos.D1.id, overId: seed.todos.D3.id });

      expect(response.status).toBe(200);
    });

    it('TD-34: Missing activeId returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/todos/reorder')
        .send({ overId: seed.todos.D2.id });

      expect(response.status).toBe(400);
    });

    it('TD-35: Missing overId returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/todos/reorder')
        .send({ activeId: seed.todos.D1.id });

      expect(response.status).toBe(400);
    });
  });
});
