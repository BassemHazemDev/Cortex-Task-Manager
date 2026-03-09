import { Router } from 'express';
import * as templateController from './template.controller';
import { authenticate } from '../../utils/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', templateController.findAll);
router.post('/', templateController.create);
router.delete('/:id', templateController.remove);

export default router;
