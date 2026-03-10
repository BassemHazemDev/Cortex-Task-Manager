import request from 'supertest';
import app from '../../src/app';

describe('Health Check', () => {
  it('H-01: Returns ok without auth', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('Auth Module', () => {
  const testEmail = `test${Date.now()}@test.com`;
  const testPassword = 'Password1!';

  describe('POST /api/v1/auth/register', () => {
    it('A-01: Register new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: testEmail,
          password: testPassword,
          passwordConfirm: testPassword,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('A-04: Duplicate email returns 409', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: testEmail,
          password: testPassword,
          passwordConfirm: testPassword,
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: testEmail,
          password: testPassword,
          passwordConfirm: testPassword,
        });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('fail');
      expect(response.body.message.toLowerCase()).toContain('email');
    });

    it('A-05: Missing name returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test2@test.com',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      expect(response.status).toBe(400);
    });

    it('A-06: Invalid email returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test',
          email: 'notanemail',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      expect(response.status).toBe(400);
    });

    it('A-07: Password too short returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test',
          email: 'test3@test.com',
          password: 'abc',
          passwordConfirm: 'abc',
        });

      expect(response.status).toBe(400);
    });

    it('A-08: Passwords dont match returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test',
          email: 'test4@test.com',
          password: 'Password1!',
          passwordConfirm: 'Different1!',
        });

      expect(response.status).toBe(400);
    });

    it('A-09: Name too long returns 400', async () => {
      const longName = 'A'.repeat(51);
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: longName,
          email: 'test5@test.com',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('A-10: Login with correct credentials', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Login Test',
          email: 'logintest@test.com',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@test.com',
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('A-11: Wrong password returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPass!',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
    });

    it('A-12: Non-existent email returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@test.com',
          password: 'Anything1!',
        });

      expect(response.status).toBe(401);
    });

    it('A-13: Missing email returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'Abc123!!',
        });

      expect(response.status).toBe(400);
    });

    it('A-14: Missing password returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@test.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('A-15: Logout clears refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Logout Test',
          email: 'logout@test.com',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      const token = registerRes.body.token;

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('A-16: Unauthenticated logout returns 401', async () => {
      const response = await request(app).post('/api/v1/auth/logout');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('A-18: Valid refresh token returns new access token', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh Test',
          email: 'refresh@test.com',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: registerRes.body.refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('A-19: Invalid refresh token returns 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: 'invalid.token.here',
        });

      expect(response.status).toBe(401);
    });

    it('A-20: Missing refreshToken field returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('A-21: Returns authenticated users profile', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Me Test',
          email: 'me@test.com',
          password: testPassword,
          passwordConfirm: testPassword,
        });

      const token = registerRes.body.token;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.name).toBe('Me Test');
      expect(response.body.data.user.email).toBe('me@test.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('A-22: No token returns 401', async () => {
      const response = await request(app).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
    });

    it('A-23: Expired token returns 401', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer expired.token');

      expect(response.status).toBe(401);
    });

    it('A-24: Malformed token returns 401', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer bad.token');

      expect(response.status).toBe(401);
    });
  });
});
