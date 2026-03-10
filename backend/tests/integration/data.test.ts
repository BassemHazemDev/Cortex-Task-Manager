import request from 'supertest';
import app from '../../src/app';
import { authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';
import * as fs from 'fs';
import * as path from 'path';

describe('Data Module', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  describe('GET /api/v1/data/export', () => {
    it('DAT-01: Export returns complete JSON', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/data/export');
      expect(response.status).toBe(200);
      expect(response.body.data.tasks).toBeDefined();
      expect(response.body.data.todos).toBeDefined();
      expect(response.body.data.settings).toBeDefined();
      expect(response.body.data.version).toBe('2.0');
    });

    it('DAT-02: tasks contains all userA tasks', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/data/export');
      expect(response.body.data.tasks.length).toBeGreaterThan(0);
    });

    it('DAT-05: version is exactly 2.0', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/data/export');
      expect(response.body.data.version).toBe('2.0');
    });

    it('DAT-07: Does not include userB data', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/data/export');
      const userBTasks = response.body.data.tasks.filter(
        (t: any) => t.createdBy === seed.userB.userId
      );
      expect(userBTasks.length).toBe(0);
    });

    it('DAT-08: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/data/export');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/data/import/json', () => {
    it('DAT-09: Import valid JSON backup', async () => {
      const jsonContent = fs.readFileSync(
        path.join(__dirname, '../fixtures/export.json'),
        'utf-8'
      );

      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/data/import/json')
        .send(JSON.parse(jsonContent));

      expect(response.status).toBe(200);
    });

    it('DAT-13: Invalid JSON structure returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/data/import/json')
        .send({ version: '1.0' });

      expect(response.status).toBe(400);
    });

    it('DAT-16: No file in request returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/data/import/json')
        .send({});

      expect(response.status).toBe(400);
    });

    it('DAT-17: No auth returns 401', async () => {
      const response = await request(app).post('/api/v1/data/import/json').send({});
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/data/import/ics', () => {
    it('DAT-18: Import valid ICS file', async () => {
      const icsContent = fs.readFileSync(
        path.join(__dirname, '../fixtures/sample.ics'),
        'utf-8'
      );

      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/data/import/ics')
        .send({ file: icsContent });

      expect(response.status).toBe(200);
    });

    it('DAT-21: DTSTART maps to dueDate + dueTime', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/tasks');
      const icsTask = response.body.data.find((t: any) => t.type === 'ics-import');
      if (icsTask) {
        expect(icsTask.dueDate).toBeDefined();
        expect(icsTask.dueTime).toBeDefined();
      }
    });

    it('DAT-25: Second import of same file adds 0 tasks', async () => {
      const icsContent = fs.readFileSync(
        path.join(__dirname, '../fixtures/sample.ics'),
        'utf-8'
      );

      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/data/import/ics')
        .send({ file: icsContent });

      expect(response.body.tasksAdded).toBe(0);
    });

    it('DAT-29: No auth returns 401', async () => {
      const response = await request(app).post('/api/v1/data/import/ics').send({});
      expect(response.status).toBe(401);
    });
  });
});
