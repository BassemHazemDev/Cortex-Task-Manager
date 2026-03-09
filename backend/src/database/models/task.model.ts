import mongoose, { Document, Schema } from 'mongoose';

export interface ISubtask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  descriptionType: 'text' | 'list' | 'chunks';
  dueDate: string;
  dueTime?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  isCompleted: boolean;
  completedAt?: Date;
  assignedSlot?: { date: string; time: string } | null;
  tags: string[];
  repeatFrequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatUntil?: string;
  type?: string;
  subtasks: ISubtask[];
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    descriptionType: {
      type: String,
      enum: ['text', 'list', 'chunks'],
      default: 'text',
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    dueTime: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    estimatedDuration: {
      type: Number,
      default: 60,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    assignedSlot: {
      date: String,
      time: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    repeatFrequency: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none',
    },
    repeatUntil: {
      type: String,
    },
    type: {
      type: String,
    },
    subtasks: [subtaskSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.index({ createdBy: 1, dueDate: 1 });
taskSchema.index({ createdBy: 1, isCompleted: 1 });
taskSchema.index({ createdBy: 1, priority: 1 });
taskSchema.index({ createdBy: 1, tags: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
