const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  GRAND ROYALE HOTEL MANAGEMENT SYSTEM                `);
      console.log(`  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`  URL: http://localhost:${PORT}                       `);
      console.log(`  Health: http://localhost:${PORT}/health              `);
      console.log(`=======================================================`);
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing HTTP server gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('[MongoDB] Database connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
