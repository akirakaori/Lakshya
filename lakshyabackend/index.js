const http = require('http');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const { app, allowedOrigins } = require('./app');
const { initializeQueue } = require('./Services/resume-parse-queue');
const { initializeSocket } = require('./socket/socket-server');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize resume parsing queue and start server
(async () => {
  try {
    // Initialize queue service (Redis or in-memory fallback)
    await initializeQueue();

    // Initialize Socket.IO after all middleware/routes are attached.
    initializeSocket(server, allowedOrigins);
    
    // Start server
    server.listen(port, () => {
      console.log(`✓ Server is running on port ${port}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();