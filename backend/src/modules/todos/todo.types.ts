export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  isCompleted?: boolean;
}

export interface ReorderInput {
  activeId: string;
  overId: string;
}
