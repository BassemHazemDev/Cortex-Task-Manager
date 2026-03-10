import request from 'supertest';

interface TestUser {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
}

export async function createTestUser(
  app: any,
  overrides: { name?: string; email?: string; password?: string } = {}
): Promise<TestUser> {
  const name = overrides.name || 'Test User';
  const email = overrides.email || `test${Date.now()}@test.com`;
  const password = overrides.password || 'Password1!';

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ name, email, password, passwordConfirm: password });

  if (response.status !== 201) {
    throw new Error(`Failed to create test user: ${response.body.message}`);
  }

  return {
    token: response.body.token,
    refreshToken: response.body.refreshToken,
    userId: response.body.data.user.id,
    email,
    name,
  };
}

export function authedAgent(app: any, token: string): any {
  const agent = request.agent(app);
  agent.auth(token, { type: 'bearer' });
  return agent;
}
