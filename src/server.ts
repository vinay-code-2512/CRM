import app from './app';
import { ENV, validateEnv } from './config/env';

import dns from 'dns';
dns.setServers(['8.8.8.8']);
const startServer = async () => {
  try {
    // Strictly validate required environment variables
    validateEnv();


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
