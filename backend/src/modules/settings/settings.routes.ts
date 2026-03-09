import { Router } from 'express';
import * as settingsController from './settings.controller';
import { authenticate } from '../../utils/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);

export default router;
