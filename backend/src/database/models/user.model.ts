import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  passwordChangedAt?: Date;
  refreshToken?: string;
  settings: {
    theme: 'light' | 'dark';
    availableHours: { start: string; end: string };
    dailyTipIndex?: { date: string; index: number };
    recentSearches: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(jwtTimestamp: number): boolean;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    passwordChangedAt: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      availableHours: {
        start: { type: String, default: '13:00' },
        end: { type: String, default: '22:00' },
      },
      dailyTipIndex: {
        date: String,
        index: Number,
      },
      recentSearches: {
        type: [String],
        default: [],
        maxlength: [5, 'Recent searches cannot exceed 5'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function (next: any) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function (next: any) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (
  jwtTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email }).select('+password');
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
