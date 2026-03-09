import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../database/models/user.model';
import { Template } from '../../database/models/template.model';
import { AppError } from '../../utils/handlers/appError';
import env from '../../config/environment';
import type { RegisterInput, LoginInput } from './auth.types';

interface TokenPayload {
  userId: string;
  email: string;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
}

class AuthService {
  private signToken(payload: TokenPayload, secret: string, expiresIn: string): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  private generateTokens(user: IUser): AuthTokens {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    return {
      token: this.signToken(payload, env.JWT_SECRET, env.JWT_EXPIRES_IN),
      refreshToken: this.signToken(payload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN),
    };
  }

  async register(data: RegisterInput): Promise<{ user: IUser; token: string; refreshToken: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    await this.seedSystemTemplates(user._id);

    const tokens = this.generateTokens(user);
    user.refreshToken = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await user.save();

    return { user, token: tokens.token, refreshToken: tokens.refreshToken };
  }

  async login(data: LoginInput): Promise<{ user: IUser; token: string; refreshToken: string }> {
    const user = await User.findByEmail(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await user.comparePassword(data.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = this.generateTokens(user);
    user.refreshToken = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await user.save();

    return { user, token: tokens.token, refreshToken: tokens.refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: undefined });
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== hashedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = this.generateTokens(user);
    user.refreshToken = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await user.save();

    return { token: tokens.token, refreshToken: tokens.refreshToken };
  }

  async getMe(userId: string): Promise<Omit<IUser, 'password' | 'refreshToken'>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  private async seedSystemTemplates(userId: any): Promise<void> {
    const templates = [
      {
        createdBy: userId,
        name: 'Text',
        descriptionType: 'text' as const,
        defaults: { title: '', description: '', descriptionType: 'text' },
        isSystem: true,
      },
      {
        createdBy: userId,
        name: 'List',
        descriptionType: 'list' as const,
        defaults: { title: '', description: '- ', descriptionType: 'list' },
        isSystem: true,
      },
      {
        createdBy: userId,
        name: 'Chunk',
        descriptionType: 'chunks' as const,
        defaults: {
          title: '',
          description: '[Objective]\n\n[Key Results]\n\n[Context]',
          descriptionType: 'chunks',
        },
        isSystem: true,
      },
    ];

    await Template.insertMany(templates);
  }
}

export default new AuthService();
