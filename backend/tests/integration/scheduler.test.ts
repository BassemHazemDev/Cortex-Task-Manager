import request from 'supertest';
import app from '../../src/app';
import { authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';

describe('Scheduler Module', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  describe('POST /api/v1/scheduler/suggest', () => {
    it('SCH-01: Returns scored suggestions', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/suggest')
        .send({ taskId: seed.tasks.T10.id });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].score).toBeDefined();
    });

    it('SCH-02: maxSuggestions limits results', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/suggest')
        .send({ taskId: seed.tasks.T10.id, maxSuggestions: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('SCH-03: Default maxSuggestions is 3', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/suggest')
        .send({ taskId: seed.tasks.T10.id });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('SCH-04: Suggestions sorted by score descending', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/suggest')
        .send({ taskId: seed.tasks.T10.id });

      expect(response.status).toBe(200);
      for (let i = 0; i < response.body.data.length - 1; i++) {
        expect(response.body.data[i].score).toBeGreaterThanOrEqual(response.body.data[i + 1].score);
      }
    });

    it('SCH-07: Task not found returns 404', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/suggest')
        .send({ taskId: '507f1f77bcf86cd799439011' });

      expect(response.status).toBe(404);
    });

    it('SCH-09: Missing taskId returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/suggest')
        .send({});

      expect(response.status).toBe(400);
    });

    it('SCH-10: No auth returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/scheduler/suggest')
        .send({ taskId: seed.tasks.T10.id });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/scheduler/optimize', () => {
    it('SCH-11: Returns suggestions for unscheduled tasks', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/scheduler/optimize');
      expect(response.status).toBe(200);
    });

    it('SCH-19: userB with no tasks returns empty array', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/scheduler/optimize');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('SCH-20: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/scheduler/optimize');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/scheduler/overdue', () => {
    it('SCH-21: Returns suggestions for overdue tasks', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/scheduler/overdue');
      expect(response.status).toBe(200);
    });

    it('SCH-24: userB with no overdue returns empty', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/scheduler/overdue');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('SCH-25: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/scheduler/overdue');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/scheduler/check-conflicts', () => {
    it('SCH-26: No conflicts found', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/check-conflicts')
        .send({ taskId: seed.tasks.T10.id, proposedDate: '2026-04-10', proposedTime: '09:00' });

      expect(response.status).toBe(200);
    });

    it('SCH-30: Missing proposedDate returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/check-conflicts')
        .send({ taskId: seed.tasks.T10.id, proposedTime: '10:00' });

      expect(response.status).toBe(400);
    });

    it('SCH-31: Missing proposedTime returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/scheduler/check-conflicts')
        .send({ taskId: seed.tasks.T10.id, proposedDate: '2026-04-01' });

      expect(response.status).toBe(400);
    });

    it('SCH-32: No auth returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/scheduler/check-conflicts')
        .send({ taskId: seed.tasks.T10.id, proposedDate: '2026-04-01', proposedTime: '10:00' });

      expect(response.status).toBe(401);
    });
  });
});
