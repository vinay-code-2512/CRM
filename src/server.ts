import app from './app';
import { ENV, validateEnv } from './config/env';
import { connectDB } from './config/db';

const startServer = async () => {
  try {
    // Strictly validate required environment variables
    validateEnv();

    // Connect to database
    await connectDB();

    // Start listening
    const PORT = parseInt(ENV.PORT, 10);
    app.listen(PORT, () => {
      console.log(`SyncForge server running in ${ENV.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
