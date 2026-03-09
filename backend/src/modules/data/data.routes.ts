import { Router } from 'express';
import * as dataController from './data.controller';
import { authenticate } from '../../utils/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/export', dataController.exportAll);
router.post('/import/json', dataController.importJSON);
router.post('/import/ics', dataController.importICS);

export default router;
