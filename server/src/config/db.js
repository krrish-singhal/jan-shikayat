import mongoose from 'mongoose';

export const connectDB = async (uri = process.env.MONGODB_URI) => {
  try {
    const mongoUri = uri || 'mongodb://localhost:27017/civic_complaints';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB Disconnected successfully.');
  } catch (error) {
    console.error(`[Database Error] Disconnect failed: ${error.message}`);
  }
};
