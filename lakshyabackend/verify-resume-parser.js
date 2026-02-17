/**
 * Resume Parser System Health Check
 * 
 * Run this to verify all components are working:
 * node verify-resume-parser.js
 */

const axios = require('axios');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`)
};

async function checkComponent(name, url, expectedFields = []) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.status === 200) {
      log.success(`${name} is running`);
      
      // Check expected fields
      if (expectedFields.length > 0) {
        expectedFields.forEach(field => {
          if (response.data[field]) {
            log.success(`  - ${field}: ${response.data[field]}`);
          } else {
            log.warn(`  - ${field}: missing`);
          }
        });
      }
      
      return true;
    } else {
      log.error(`${name} returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error(`${name} is not running (connection refused)`);
      log.info(`  Start it with: ${getStartCommand(name)}`);
    } else {
      log.error(`${name} check failed: ${error.message}`);
    }
    return false;
  }
}

function getStartCommand(component) {
  switch (component) {
    case 'Python Parser':
      return 'cd resume-parser-service && venv\\Scripts\\activate && python main.py';
    case 'Backend API':
      return 'cd lakshyabackend && node index.js';
    case 'Frontend':
      return 'cd lakshyafrontend && npm run dev';
    default:
      return 'unknown';
  }
}

async function checkDatabaseConnection() {
  const mongoose = require('mongoose');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lakshya', {
      serverSelectionTimeoutMS: 5000
    });
    log.success('MongoDB connection successful');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    log.info('  Check your MONGODB_URI in .env');
    return false;
  }
}

async function checkRedis() {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 3000
      }
    });
    
    await client.connect();
    await client.ping();
    log.success('Redis connection successful (BullMQ queue available)');
    await client.quit();
    return true;
  } catch (error) {
    log.warn('Redis not available (will use in-memory queue fallback)');
    log.info('  This is OK for development, but install Redis for production');
    return false;
  }
}

async function checkCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    log.error('Cloudinary credentials missing in .env');
    log.info('  Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    return false;
  }
  
  log.success('Cloudinary credentials configured');
  return true;
}

async function main() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  Resume Parser System Health Check     │');
  console.log('└─────────────────────────────────────────┘\n');

  let allGood = true;

  // Check environment
  log.header('1. Checking Environment');
  require('dotenv').config();
  log.success('Environment variables loaded');
  
  // Check Python parser
  log.header('2. Checking Python Parser Service');
  const pythonOk = await checkComponent(
    'Python Parser',
    'http://localhost:8000',
    ['status', 'service', 'spacy_loaded']
  );
  allGood = allGood && pythonOk;
  
  // Check backend
  log.header('3. Checking Backend API');
  const backendOk = await checkComponent(
    'Backend API',
    'http://localhost:3000/ping',
    ['success', 'message']
  );
  allGood = allGood && backendOk;
  
  // Check database
  log.header('4. Checking MongoDB Connection');
  const dbOk = await checkDatabaseConnection();
  allGood = allGood && dbOk;
  
  // Check Redis (optional)
  log.header('5. Checking Redis (Optional)');
  await checkRedis(); // Don't fail if Redis not available
  
  // Check Cloudinary
  log.header('6. Checking Cloudinary Configuration');
  const cloudinaryOk = checkCloudinary();
  allGood = allGood && cloudinaryOk;
  
  // Check frontend (optional since it might not be running)
  log.header('7. Checking Frontend (Optional)');
  await checkComponent('Frontend', 'http://localhost:5173');
  
  // Summary
  log.header('Summary');
  if (allGood) {
    log.success('All critical components are healthy! ✨');
    log.info('\nYou can now:');
    log.info('  1. Open http://localhost:5173 in your browser');
    log.info('  2. Login as a Job Seeker');
    log.info('  3. Go to Profile and upload a resume');
    log.info('  4. Watch the parsing status badge update in real-time');
  } else {
    log.error('Some components have issues. Please fix them and try again.');
    log.info('\nRefer to RESUME_PARSER_OPTIMIZATION.md for setup instructions.');
  }
  
  console.log('\n');
  process.exit(allGood ? 0 : 1);
}

main().catch(error => {
  log.error(`Health check failed: ${error.message}`);
  process.exit(1);
});
