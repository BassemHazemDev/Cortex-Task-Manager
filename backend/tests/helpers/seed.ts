import { createTestUser, authedAgent } from './auth';

interface SeedData {
  userA: {
    token: string;
    refreshToken: string;
    userId: string;
    email: string;
    name: string;
  };
  userB: {
    token: string;
    refreshToken: string;
    userId: string;
    email: string;
    name: string;
  };
  tasks: {
    [key: string]: {
      id: string;
      title: string;
      dueDate: string;
      dueTime?: string;
      priority: string;
      estimatedDuration: number;
      tags: string[];
      isCompleted: boolean;
      assignedSlot?: { date: string; time: string } | null;
      subtasks: { title: string; isCompleted: boolean }[];
    };
  };
  todos: {
    [key: string]: {
      id: string;
      title: string;
      description?: string;
      priority: string;
      isCompleted: boolean;
      order: number;
    };
  };
  templates: {
    [key: string]: {
      id: string;
      name: string;
      descriptionType: string;
      isSystem: boolean;
    };
  };
}

const getDate = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export async function seedData(app: any): Promise<SeedData> {
  const TODAY = getDate(0);
  const TOMORROW = getDate(1);
  const DAY_AFTER_TOMORROW = getDate(2);
  const YESTERDAY = getDate(-1);
  const THREE_DAYS_AGO = getDate(-3);
  const NEXT_WEEK = getDate(7);
  const THIS_WEEK = getDate(7);

  const userA = await createTestUser(app, {
    name: 'Alice Cortex',
    email: 'alice@test.com',
    password: 'Password1!',
  });

  const userB = await createTestUser(app, {
    name: 'Bob Cortex',
    email: 'bob@test.com',
    password: 'Password2!',
  });

  const agentA = authedAgent(app, userA.token);

  const tasks: SeedData['tasks'] = {};

  const taskDefs = [
    { key: 'T1', title: 'Submit assignment', dueDate: TODAY, dueTime: '14:00', priority: 'high', duration: 90, tags: ['deadline', 'course'], completed: false, slot: null, subtasks: [{ title: 'Outline', isCompleted: false }, { title: 'Draft', isCompleted: false }] },
    { key: 'T2', title: 'Team meeting', dueDate: TODAY, dueTime: '16:00', priority: 'medium', duration: 60, tags: ['meeting'], completed: false, slot: { date: TODAY, time: '16:00' }, subtasks: [] },
    { key: 'T3', title: 'Read chapter 5', dueDate: TOMORROW, dueTime: null, priority: 'low', duration: 45, tags: ['lecture'], completed: false, slot: null, subtasks: [] },
    { key: 'T4', title: 'Weekly review', dueDate: TOMORROW, dueTime: '10:00', priority: 'high', duration: 30, tags: ['task'], completed: false, slot: null, subtasks: [] },
    { key: 'T5', title: 'Gym session', dueDate: DAY_AFTER_TOMORROW, dueTime: '07:00', priority: 'low', duration: 60, tags: ['activity'], completed: false, slot: null, subtasks: [] },
    { key: 'T6', title: 'Project proposal', dueDate: THIS_WEEK, dueTime: null, priority: 'high', duration: 120, tags: ['deadline', 'task'], completed: false, slot: null, subtasks: [{ title: 'Research', isCompleted: true }, { title: 'Write', isCompleted: false }] },
    { key: 'T7', title: 'Finished task', dueDate: YESTERDAY, dueTime: '09:00', priority: 'medium', duration: 30, tags: ['task'], completed: true, slot: null, subtasks: [] },
    { key: 'T8', title: 'Overdue task', dueDate: THREE_DAYS_AGO, dueTime: '10:00', priority: 'high', duration: 60, tags: ['deadline'], completed: false, slot: null, subtasks: [] },
    { key: 'T9', title: 'Section review', dueDate: TODAY, dueTime: '11:00', priority: 'medium', duration: 50, tags: ['section', 'course'], completed: false, slot: null, subtasks: [] },
    { key: 'T10', title: 'Unscheduled personal', dueDate: NEXT_WEEK, dueTime: null, priority: 'medium', duration: 60, tags: ['task'], completed: false, slot: null, subtasks: [] },
  ];

  for (const def of taskDefs) {
    const response = await agentA
      .post('/api/v1/tasks')
      .send({
        title: def.title,
        dueDate: def.dueDate,
        dueTime: def.dueTime,
        priority: def.priority,
        estimatedDuration: def.duration,
        tags: def.tags,
        isCompleted: def.completed,
        assignedSlot: def.slot,
        subtasks: def.subtasks,
      });

    tasks[def.key] = {
      id: response.body.data?._id || response.body.task?._id,
      title: def.title,
      dueDate: def.dueDate,
      dueTime: def.dueTime || undefined,
      priority: def.priority,
      estimatedDuration: def.duration,
      tags: def.tags,
      isCompleted: def.completed,
      assignedSlot: def.slot,
      subtasks: def.subtasks,
    };
  }

  const todos: SeedData['todos'] = {};

  const todoDefs = [
    { key: 'D1', title: 'Buy groceries', description: 'Milk, eggs, bread', priority: 'low', completed: false, order: 0 },
    { key: 'D2', title: 'Call dentist', description: null, priority: 'medium', completed: false, order: 1 },
    { key: 'D3', title: 'Review pull request', description: 'Review PR #42', priority: 'high', completed: false, order: 2 },
    { key: 'D4', title: 'Pay electricity bill', description: null, priority: 'high', completed: true, order: 3 },
    { key: 'D5', title: 'Read book chapter', description: 'Chapter 7', priority: 'low', completed: false, order: 4 },
  ];

  for (const def of todoDefs) {
    const response = await agentA.post('/api/v1/todos').send({
      title: def.title,
      description: def.description,
      priority: def.priority,
      isCompleted: def.completed,
    });

    todos[def.key] = {
      id: response.body.data._id,
      title: def.title,
      description: def.description || undefined,
      priority: def.priority,
      isCompleted: def.completed,
      order: def.order,
    };
  }

  const customTemplate = await agentA.post('/api/v1/templates').send({
    name: 'Study Session',
    descriptionType: 'chunks',
    defaults: { title: '', description: '', descriptionType: 'chunks' },
  });

  const templates = {
    TPL_TEXT: { id: '', name: 'Text', descriptionType: 'text', isSystem: true },
    TPL_LIST: { id: '', name: 'List', descriptionType: 'list', isSystem: true },
    TPL_CHUNK: { id: '', name: 'Chunk', descriptionType: 'chunks', isSystem: true },
    TPL_CUSTOM: { id: customTemplate.body.data._id, name: 'Study Session', descriptionType: 'chunks', isSystem: false },
  };

  const templatesResponse = await agentA.get('/api/v1/templates');
  const templateList = templatesResponse.body.data;

  templates.TPL_TEXT.id = templateList.find((t: any) => t.name === 'Text' && t.isSystem)._id;
  templates.TPL_LIST.id = templateList.find((t: any) => t.name === 'List' && t.isSystem)._id;
  templates.TPL_CHUNK.id = templateList.find((t: any) => t.name === 'Chunk' && t.isSystem)._id;

  return { userA, userB, tasks, todos, templates };
}
