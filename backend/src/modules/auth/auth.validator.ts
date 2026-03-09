import { z } from 'zod';

export const RegisterDTO = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string(),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  }),
});

export const LoginDTO = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const RefreshTokenDTO = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type RegisterInput = z.infer<typeof RegisterDTO>['body'];
export type LoginInput = z.infer<typeof LoginDTO>['body'];
export type RefreshTokenInput = z.infer<typeof RefreshTokenDTO>['body'];
