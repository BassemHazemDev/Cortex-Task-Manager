import mongoose from 'mongoose';

export interface TimeSlot {
  date: string;
  time: string;
}

export interface Task {
  _id: mongoose.Types.ObjectId;
  title: string;
  dueDate: string;
  dueTime?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  assignedSlot?: { date: string; time: string } | null;
  tags: string[];
  isCompleted?: boolean;
}

export interface AvailableHours {
  start: string;
  end: string;
}

export interface SlotSuggestion {
  slot: TimeSlot;
  score: number;
  reason?: string;
}

const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

const getCurrentTimeRounded = (): number => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(currentMinutes / 30) * 30;
};

export const findAvailableSlots = (
  task: Task,
  existingTasks: Task[],
  availableHours: AvailableHours,
  date: string
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const taskDuration = task.estimatedDuration || 60;

  const startMinutes = parseTime(availableHours.start);
  let endMinutes = parseTime(availableHours.end);

  if (isToday(date)) {
    const currentTime = getCurrentTimeRounded();
    if (currentTime > startMinutes) {
      return slots;
    }
  }

  const conflictingTasks = existingTasks.filter(
    (t) => t.dueDate === date && t.assignedSlot && !t.isCompleted
  );

  let currentSlotStart = startMinutes;

  while (currentSlotStart + taskDuration <= endMinutes) {
    const hasConflict = conflictingTasks.some((t) => {
      if (!t.assignedSlot) return false;
      const tStart = parseTime(t.assignedSlot.time);
      const tDuration = t.estimatedDuration || 60;
      const tEnd = tStart + tDuration;

      const slotEnd = currentSlotStart + taskDuration;

      return (
        (currentSlotStart >= tStart && currentSlotStart < tEnd) ||
        (slotEnd > tStart && slotEnd <= tEnd) ||
        (currentSlotStart <= tStart && slotEnd >= tEnd)
      );
    });

    if (!hasConflict) {
      slots.push({
        date,
        time: formatTime(currentSlotStart),
      });
      break;
    }

    currentSlotStart += 30;
  }

  return slots;
};

export const calculateSlotScore = (
  slot: TimeSlot,
  task: Task,
  dayOffset: number
): number => {
  let score = 100;
  const slotMinutes = parseTime(slot.time);
  const priority = task.priority;

  if (priority === 'high' && slotMinutes < 12 * 60) {
    score += 20;
  }
  if (priority === 'low' && slotMinutes >= 14 * 60) {
    score += 10;
  }

  score -= dayOffset * 5;

  const priorityMultiplier = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
  score *= priorityMultiplier;

  return score;
};

export const suggestOptimalSlots = (
  task: Task,
  existingTasks: Task[],
  availableHours: AvailableHours,
  maxSuggestions: number = 3
): SlotSuggestion[] => {
  const suggestions: SlotSuggestion[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = addDays(new Date().toISOString().split('T')[0], dayOffset);
    const slots = findAvailableSlots(task, existingTasks, availableHours, date);

    for (const slot of slots) {
      const score = calculateSlotScore(slot, task, dayOffset);
      suggestions.push({ slot, score });
    }
  }

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, maxSuggestions);
};

export const checkConflicts = (
  task: Task,
  proposedDate: string,
  proposedTime: string,
  existingTasks: Task[]
): Task[] => {
  const taskStart = parseTime(proposedTime);
  const taskDuration = task.estimatedDuration || 60;
  const taskEnd = taskStart + taskDuration;

  return existingTasks.filter((t) => {
    if (t._id.equals(task._id)) return false;
    if (t.dueDate !== proposedDate) return false;
    if (!t.assignedSlot) return false;
    if (t.isCompleted) return false;

    const tStart = parseTime(t.assignedSlot.time);
    const tDuration = t.estimatedDuration || 60;
    const tEnd = tStart + tDuration;

    return (
      (taskStart >= tStart && taskStart < tEnd) ||
      (taskEnd > tStart && taskEnd <= tEnd) ||
      (taskStart <= tStart && taskEnd >= tEnd)
    );
  });
};

export const hasTimeConflict = (taskA: Task, taskB: Task): boolean => {
  if (!taskA.assignedSlot || !taskB.assignedSlot) return false;
  if (taskA.dueDate !== taskB.dueDate) return false;

  const aStart = parseTime(taskA.assignedSlot.time);
  const aDuration = taskA.estimatedDuration || 60;
  const aEnd = aStart + aDuration;

  const bStart = parseTime(taskB.assignedSlot.time);
  const bDuration = taskB.estimatedDuration || 60;
  const bEnd = bStart + bDuration;

  return (
    (aStart >= bStart && aStart < bEnd) ||
    (aEnd > bStart && aEnd <= bEnd) ||
    (aStart <= bStart && aEnd >= bEnd)
  );
};

export const generateRecurringDates = (
  startDate: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  repeatUntil: string
): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  const endDate = new Date(repeatUntil);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);

    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }

  return dates;
};

export const autoReschedule = (
  task: Task,
  allTasks: Task[],
  availableHours: AvailableHours
): { success: boolean; newSlot?: TimeSlot; reason?: string } => {
  const suggestions = suggestOptimalSlots(task, allTasks, availableHours, 1);

  if (suggestions.length === 0) {
    return { success: false, reason: 'No available slots found' };
  }

  const best = suggestions[0];
  if (best.score < 50) {
    return { success: false, reason: 'Score too low' };
  }

  return { success: true, newSlot: best.slot, reason: `Score: ${best.score}` };
};
