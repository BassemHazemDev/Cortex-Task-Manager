import { Router } from 'express';
import * as taskController from './task.controller';
import { validate } from '../../utils/middleware/validate.middleware';
import { authenticate } from '../../utils/middleware/auth.middleware';
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskQueryDTO,
  BulkIdsDTO,
  DropTaskDTO,
  AssignSlotDTO,
  SubtaskDTO,
  SubtaskUpdateDTO,
} from './task.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(TaskQueryDTO), taskController.getAll);
router.post('/', validate(CreateTaskDTO), taskController.create);
router.get('/statistics', taskController.getStatistics);
router.post('/bulk-complete', validate(BulkIdsDTO), taskController.bulkComplete);
router.post('/bulk-delete', validate(BulkIdsDTO), taskController.bulkDelete);

router.get('/:id', taskController.findById);
router.patch('/:id', validate(UpdateTaskDTO), taskController.update);
router.delete('/:id', taskController.remove);
router.patch('/:id/toggle-complete', taskController.toggleComplete);
router.patch('/:id/drop', validate(DropTaskDTO), taskController.dropReschedule);
router.patch('/:id/assign-slot', validate(AssignSlotDTO), taskController.assignSlot);
router.post('/:id/duplicate', taskController.duplicateTask);

router.post('/:id/subtasks', validate(SubtaskDTO), taskController.addSubtask);
router.patch('/:id/subtasks/:sid', validate(SubtaskUpdateDTO), taskController.updateSubtask);
router.delete('/:id/subtasks/:sid', taskController.deleteSubtask);
router.patch('/:id/subtasks/:sid/toggle', taskController.toggleSubtaskComplete);

export default router;
