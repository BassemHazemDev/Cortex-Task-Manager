import request from 'supertest';
import app from '../../src/app';
import { authedAgent } from '../helpers/auth';
import { seedData } from '../helpers/seed';

describe('Templates Module', () => {
  let seed: any;

  beforeAll(async () => {
    seed = await seedData(app);
  });

  describe('GET /api/v1/templates', () => {
    it('TPL-01: Returns all 4 templates', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/templates');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(4);
    });

    it('TPL-02: System templates have isSystem:true', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/templates');
      const systemTemplates = response.body.data.filter((t: any) => t.isSystem);
      expect(systemTemplates.length).toBe(3);
    });

    it('TPL-03: userB sees only their own templates', async () => {
      const response = await authedAgent(app, seed.userB.token).get('/api/v1/templates');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });

    it('TPL-04: No auth returns 401', async () => {
      const response = await request(app).get('/api/v1/templates');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/templates', () => {
    it('TPL-05: Create custom template', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/templates')
        .send({
          name: 'Sprint Plan',
          descriptionType: 'chunks',
          defaults: { title: '', description: '', descriptionType: 'chunks' },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Sprint Plan');
      expect(response.body.data.isSystem).toBe(false);
    });

    it('TPL-07: Missing name returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/templates')
        .send({ descriptionType: 'text' });

      expect(response.status).toBe(400);
    });

    it('TPL-08: Invalid descriptionType returns 400', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .post('/api/v1/templates')
        .send({ name: 'Test', descriptionType: 'other' });

      expect(response.status).toBe(400);
    });

    it('TPL-09: No auth returns 401', async () => {
      const response = await request(app).post('/api/v1/templates').send({ name: 'Test' });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/templates/:id', () => {
    it('TPL-10: Delete custom template', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .delete(`/api/v1/templates/${seed.templates.TPL_CUSTOM.id}`);

      expect(response.status).toBe(200);
    });

    it('TPL-11: Deleted template not in list', async () => {
      const response = await authedAgent(app, seed.userA.token).get('/api/v1/templates');
      expect(response.body.data.length).toBe(3);
    });

    it('TPL-12: Delete system template returns 403', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .delete(`/api/v1/templates/${seed.templates.TPL_TEXT.id}`);

      expect(response.status).toBe(403);
    });

    it('TPL-14: Non-existent ID returns 404', async () => {
      const response = await authedAgent(app, seed.userA.token)
        .delete('/api/v1/templates/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });

    it('TPL-15: No auth returns 401', async () => {
      const response = await request(app).delete('/api/v1/templates/123');
      expect(response.status).toBe(401);
    });
  });
});
