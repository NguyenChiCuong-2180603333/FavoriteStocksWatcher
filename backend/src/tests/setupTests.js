// src/tests/setupTests.js
process.env.FINNHUB_API_KEY = 'DEFAULT_TEST_KEY_FROM_SETUP'; // QUAN TRỌNG: Bỏ comment hoặc thêm dòng này

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import request from 'supertest';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

export const api = request(app);