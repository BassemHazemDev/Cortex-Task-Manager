import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import taskRoutes from './tasks/task.routes';
import todoRoutes from './todos/todo.routes';
import templateRoutes from './templates/template.routes';
import settingsRoutes from './settings/settings.routes';
import schedulerRoutes from './scheduler/scheduler.routes';
import dataRoutes from './data/data.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/todos', todoRoutes);
router.use('/templates', templateRoutes);
router.use('/settings', settingsRoutes);
router.use('/scheduler', schedulerRoutes);
router.use('/data', dataRoutes);

export default router;
