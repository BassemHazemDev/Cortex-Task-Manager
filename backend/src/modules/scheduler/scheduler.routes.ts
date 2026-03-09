import { Router } from 'express';
import * as schedulerController from './scheduler.controller';
import { authenticate } from '../../utils/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/suggest', schedulerController.suggestSlots);
router.get('/optimize', schedulerController.optimizeUnscheduled);
router.get('/overdue', schedulerController.getOverdueSuggestions);
router.post('/check-conflicts', schedulerController.checkConflicts);

export default router;
