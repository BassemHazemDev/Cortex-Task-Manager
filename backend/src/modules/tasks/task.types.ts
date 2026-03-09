export interface CreateTaskInput {
  title: string;
  description?: string;
  descriptionType?: 'text' | 'list' | 'chunks';
  dueDate: string;
  dueTime?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedDuration?: number;
  tags?: string[];
  repeatFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatUntil?: string;
  subtasks?: { title: string }[];
  type?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  isCompleted?: boolean;
  assignedSlot?: { date: string; time: string } | null;
  completedAt?: Date;
}

export interface TaskQuery {
  status?: 'pending' | 'completed' | 'overdue';
  day?: 'today' | 'tomorrow' | 'dayAfterTomorrow' | 'thisWeek' | 'thisMonth' | 'all';
  tags?: string;
  sort?: 'dueDate' | 'priority' | 'title' | 'createdAt';
  search?: string;
  page?: string;
  limit?: string;
}

export interface BulkIdsInput {
  ids: string[];
}

export interface DropTaskInput {
  newDate: string;
}

export interface AssignSlotInput {
  date: string;
  time: string;
}

export interface SubtaskInput {
  title: string;
}

export interface TaskStatistics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  next7Days: { date: string; count: number }[];
}
