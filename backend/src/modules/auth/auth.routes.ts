import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../utils/middleware/validate.middleware';
import { authenticate } from '../../utils/middleware/auth.middleware';
import { RegisterDTO, LoginDTO, RefreshTokenDTO } from './auth.validator';

const router = Router();

router.post('/register', validate(RegisterDTO), authController.register);
router.post('/login', validate(LoginDTO), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', validate(RefreshTokenDTO), authController.refreshToken);
router.get('/me', authenticate, authController.getMe);

export default router;
