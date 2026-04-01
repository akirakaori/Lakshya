const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Load environment variables FIRST before any other imports
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const jobRoutes = require('./routes/job-routes');
const applicationRoutes = require('./routes/application-routes');
const adminRoutes = require('./routes/admin-routes');
const recruiterRoutes = require('./routes/recruiter-routes');
const jobSeekerRoutes = require('./routes/job-seeker-routes');
const landingRoutes = require('./routes/landing-routes');
const notificationRoutes = require('./routes/notification-routes');

// Import middleware
const errorHandler = require('./Middleware/error-handler');

require('./models/database');

// Import queue service
const { initializeQueue } = require('./Services/resume-parse-queue');
const { initializeSocket, parseAllowedOrigins } = require('./socket/socket-server');

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

const frontendOriginConfig = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const allowedOrigins = parseAllowedOrigins(frontendOriginConfig);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Middlewares
app.use(bodyParser.json());
app.use(cors(corsOptions));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('=== INCOMING REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body);
    next();
  });
}

// Health check
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// API Routes
app.use('/api/public', landingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/job-seeker', jobSeekerRoutes);
app.use('/api/notifications', notificationRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Lakshya Job Portal API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

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