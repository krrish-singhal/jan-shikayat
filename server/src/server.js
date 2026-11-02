import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] JanShikayat Municipal API running on port ${PORT}`);
      console.log(`[Server] Base API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[Server Fatal] Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();
