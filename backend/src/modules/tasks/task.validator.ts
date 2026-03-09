import { z } from 'zod';

export const CreateTaskDTO = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    descriptionType: z.enum(['text', 'list', 'chunks']).optional(),
    dueDate: z.string().min(1, 'Due date is required'),
    dueTime: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    estimatedDuration: z.number().optional(),
    tags: z.array(z.string()).optional(),
    repeatFrequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
    repeatUntil: z.string().optional(),
    subtasks: z.array(z.object({ title: z.string() })).optional(),
    type: z.string().optional(),
  }),
});

export const UpdateTaskDTO = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    descriptionType: z.enum(['text', 'list', 'chunks']).optional(),
    dueDate: z.string().optional(),
    dueTime: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    estimatedDuration: z.number().optional(),
    tags: z.array(z.string()).optional(),
    repeatFrequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
    repeatUntil: z.string().optional(),
    isCompleted: z.boolean().optional(),
    assignedSlot: z
      .object({
        date: z.string(),
        time: z.string(),
      })
      .nullable()
      .optional(),
    completedAt: z.date().optional(),
    subtasks: z.array(z.object({
      _id: z.string().optional(),
      title: z.string(),
      isCompleted: z.boolean().optional(),
      createdAt: z.date().optional(),
    })).optional(),
  }),
});

export const TaskQueryDTO = z.object({
  query: z.object({
    status: z.enum(['pending', 'completed', 'overdue']).optional(),
    day: z.enum(['today', 'tomorrow', 'dayAfterTomorrow', 'thisWeek', 'thisMonth', 'all']).optional(),
    tags: z.string().optional(),
    sort: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  }),
});

export const BulkIdsDTO = z.object({
  body: z.object({
    ids: z.array(z.string()),
  }),
});

export const DropTaskDTO = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    newDate: z.string().min(1, 'New date is required'),
  }),
});

export const AssignSlotDTO = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
  }),
});

export const SubtaskDTO = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required'),
  }),
});

export const SubtaskUpdateDTO = z.object({
  params: z.object({
    id: z.string(),
    sid: z.string(),
  }),
  body: z.object({
    title: z.string().optional(),
    isCompleted: z.boolean().optional(),
  }),
});

export const CheckConflictDTO = z.object({
  body: z.object({
    proposedDate: z.string(),
    proposedTime: z.string(),
  }),
});

export type CreateTaskInput = z.infer<typeof CreateTaskDTO>['body'];
export type UpdateTaskInput = z.infer<typeof UpdateTaskDTO>['body'];
export type TaskQuery = z.infer<typeof TaskQueryDTO>['query'];
