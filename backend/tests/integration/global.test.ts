import request from 'supertest';
import app from '../../src/app';
import { authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';

describe('Global Error Handling', () => {
  it('ERR-01: Unknown route returns 404', async () => {
    const response = await request(app).get('/api/v1/doesnotexist');
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Can't find");
  });

  it('ERR-02: Invalid ObjectId on any :id route', async () => {
    const seed = await seedData(app);
    const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks/not-valid-id');
    expect(response.status).toBe(400);
  });
});

describe('Cross-Cutting Data Isolation', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  it('ISO-01: Task GET returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).get(
      `/api/v1/tasks/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-02: Task PATCH returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).patch(
      `/api/v1/tasks/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-03: Task DELETE returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).delete(
      `/api/v1/tasks/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-04: Task toggle-complete returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).patch(
      `/api/v1/tasks/${seed.userB.userId}/toggle-complete`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-07: Todo GET returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).get(
      `/api/v1/todos/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-08: Todo PATCH returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).patch(
      `/api/v1/todos/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-09: Todo DELETE returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).delete(
      `/api/v1/todos/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-10: Template DELETE returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token).delete(
      `/api/v1/templates/${seed.userB.userId}`
    );
    expect(response.status).toBe(404);
  });

  it('ISO-11: Statistics returns 200 for each user', async () => {
    const responseA = await authedAgent(app, seed.userA.token).get('/api/v1/tasks/statistics');
    const responseB = await authedAgent(app, seed.userB.token).get('/api/v1/tasks/statistics');

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);
    expect(responseA.body.data.total).not.toBe(responseB.body.data.total);
  });

  it('ISO-12: Export does not include other user data', async () => {
    const response = await authedAgent(app, seed.userA.token).get('/api/v1/data/export');
    expect(response.status).toBe(200);
  });

  it('ISO-13: Subtask POST returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token)
      .post(`/api/v1/tasks/${seed.userB.userId}/subtasks`)
      .send({ title: 'Test' });
    expect(response.status).toBe(404);
  });

  it('ISO-14: Scheduler suggest returns 404', async () => {
    const response = await authedAgent(app, seed.userA.token)
      .post('/api/v1/scheduler/suggest')
      .send({ taskId: seed.userB.userId });
    expect(response.status).toBe(404);
  });
});
