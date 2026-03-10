import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.MONGOMS_DISABLE_POSTINSTALL = '1';
process.env.MONGOMS_SKIP_MONGOSH = '1';
process.env.MONGOMS_STARTUP_TIMEOUT = '120000';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      storageEngine: 'wiredTiger',
      launchTimeout: 120000,
    },
    binary: {
      checkMD5: false,
    },
  });
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 120000,
    socketTimeoutMS: 120000,
    bufferCommands: false,
    maxPoolSize: 10,
  });
  
  console.log('MongoDB connected:', mongoUri);
}, 300000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
