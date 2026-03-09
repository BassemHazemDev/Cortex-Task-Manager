import mongoose from 'mongoose';
import env from '../config/environment';

const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};

export { connectDatabase, disconnectDatabase };
