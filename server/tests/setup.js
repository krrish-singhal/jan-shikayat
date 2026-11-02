import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/civic_complaints_test';

export async function setupTestDB() {
  await connectDB(TEST_DB_URI);
}

export async function clearTestDB() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export async function teardownTestDB() {
  await clearTestDB();
  await disconnectDB();
}
