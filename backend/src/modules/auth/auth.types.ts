export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  status: string;
  token: string;
  refreshToken: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}
