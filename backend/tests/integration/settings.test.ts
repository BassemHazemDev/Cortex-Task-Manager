import request from 'supertest';
import app from '../../src/app';
import { authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';

describe('Settings Module', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  describe('GET /api/v1/settings', () => {
    it('SET-01: Returns full settings object', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/settings');
      expect(response.status).toBe(200);
      expect(response.body.data.theme).toBe('light');
      expect(response.body.data.availableHours.start).toBe('13:00');
      expect(response.body.data.availableHours.end).toBe('22:00');
    });

    it('SET-02: Each user has independent settings', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/settings');
      expect(response.status).toBe(200);
    });

    it('SET-03: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/settings');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/settings', () => {
    it('SET-04: Update theme to dark', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/settings')
        .send({ theme: 'dark' });

      expect(response.status).toBe(200);
      expect(response.body.data.theme).toBe('dark');
    });

    it('SET-05: Update availableHours', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/settings')
        .send({ availableHours: { start: '09:00', end: '18:00' } });

      expect(response.status).toBe(200);
      expect(response.body.data.availableHours.start).toBe('09:00');
    });

    it('SET-06: Update recentSearches', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/settings')
        .send({ recentSearches: ['lecture', 'deadline'] });

      expect(response.status).toBe(200);
      expect(response.body.data.recentSearches).toEqual(['lecture', 'deadline']);
    });

    it('SET-07: Partial update leaves other fields intact', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/settings')
        .send({ theme: 'dark' });

      expect(response.status).toBe(200);
      expect(response.body.data.theme).toBe('dark');
      expect(response.body.data.availableHours).toBeDefined();
    });

    it('SET-08: Invalid theme value returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/settings')
        .send({ theme: 'rainbow' });

      expect(response.status).toBe(400);
    });

    it('SET-09: availableHours missing start returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .patch('/api/v1/settings')
        .send({ availableHours: { end: '18:00' } });

      expect(response.status).toBe(400);
    });

    it('SET-10: No auth returns 401', async () => {
      const response = await request(app).patch('/api/v1/settings').send({ theme: 'dark' });
      expect(response.status).toBe(401);
    });
  });
});
