import mongoose, { Document, Schema } from 'mongoose';

export interface ITodo extends Document {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  order: number;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Todo title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

todoSchema.index({ createdBy: 1, order: 1 });

export const Todo = mongoose.model<ITodo>('Todo', todoSchema);
