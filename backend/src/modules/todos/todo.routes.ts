import { Router } from 'express';
import * as todoController from './todo.controller';
import { authenticate } from '../../utils/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', todoController.findAll);
router.post('/', todoController.create);
router.get('/:id', todoController.findById);
router.patch('/:id', todoController.update);
router.delete('/:id', todoController.remove);
router.patch('/:id/toggle-complete', todoController.toggleComplete);
router.patch('/reorder', todoController.reorder);

export default router;
