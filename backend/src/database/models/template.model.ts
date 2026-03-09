import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  descriptionType: 'text' | 'list' | 'chunks';
  defaults: {
    title: string;
    description: string;
    descriptionType: string;
  };
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    descriptionType: {
      type: String,
      enum: ['text', 'list', 'chunks'],
      default: 'text',
    },
    defaults: {
      title: {
        type: String,
        default: '',
      },
      description: {
        type: String,
        default: '',
      },
      descriptionType: {
        type: String,
        default: 'text',
      },
    },
    isSystem: {
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

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
