const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Load environment variables FIRST before any other imports
dotenv.config();

// Import routes
const authRoutes = require('./Routes/auth-routes');
const profileRoutes = require('./Routes/profile-routes');
const jobRoutes = require('./Routes/job-routes');
const applicationRoutes = require('./Routes/application-routes');
const adminRoutes = require('./Routes/admin-routes');
const recruiterRoutes = require('./Routes/recruiter-routes');

// Import middleware
const errorHandler = require('./Middleware/error-handler');

require('./models/database');

// Import queue service
const { initializeQueue } = require('./Services/resume-parse-queue');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());

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
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recruiter', recruiterRoutes);

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
    
    // Start server
    app.listen(port, () => {
      console.log(`✓ Server is running on port ${port}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();