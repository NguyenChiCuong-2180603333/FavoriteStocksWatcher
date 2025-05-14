import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const globalTeardown = async () => {
  if (mongoose.connection) {
    await mongoose.disconnect();
  }
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};

export default globalTeardown;