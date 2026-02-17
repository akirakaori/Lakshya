/**
 * Resume Parse Queue Service
 * 
 * Supports two modes:
 * 1. BullMQ with Redis (production-ready, persistent)
 * 2. Simple in-memory queue (development fallback)
 * 
 * Automatically detects Redis availability and falls back accordingly.
 */

const resumeParserService = require('./resume-parser-service');
const UserModel = require('../models/user-model');

let Queue, Worker;
let resumeQueue = null;
let isUsingRedis = false;

// Try to load BullMQ (optional dependency)
try {
  const bullmq = require('bullmq');
  Queue = bullmq.Queue;
  Worker = bullmq.Worker;
  console.log('✅ BullMQ detected - Redis queue available');
} catch (error) {
  console.log('ℹ️  BullMQ not installed - using in-memory queue fallback');
}

/**
 * Initialize queue service
 */
const initializeQueue = async () => {
  if (Queue && Worker) {
    try {
      // Try to create BullMQ queue with Redis
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: 3,
        connectTimeout: 5000
      };

      resumeQueue = new Queue('resume-parsing', { connection: redisConfig });

      // Create worker to process jobs
      const worker = new Worker(
        'resume-parsing',
        async (job) => {
          console.log(`\n📋 Processing resume parse job: ${job.id}`);
          console.log(`👤 User ID: ${job.data.userId}`);
          
          await processResumeParseJob(job.data);
        },
        { connection: redisConfig, concurrency: 3 }
      );

      worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
      });

      // Test Redis connection
      await resumeQueue.waitUntilReady();
      isUsingRedis = true;
      console.log('✅ Resume parsing queue initialized with Redis');

      return true;
    } catch (error) {
      console.warn('⚠️  Redis connection failed:', error.message);
      console.warn('   Falling back to in-memory queue');
      resumeQueue = null;
      isUsingRedis = false;
    }
  }

  // In-memory queue fallback
  if (!resumeQueue) {
    console.log('✅ Resume parsing queue initialized with in-memory fallback');
  }

  return true;
};

/**
 * Add resume parse job to queue
 * 
 * @param {string} userId - User ID
 * @param {string} resumeUrl - Resume URL or public ID
 * @param {object} options - Additional options
 */
const queueResumeParseJob = async (userId, resumeUrl, options = {}) => {
  // Generate unique run ID for this parse attempt
  const runId = `run_${Date.now()}_${userId.substring(0, 8)}`;
  
  const jobData = {
    userId,
    resumeUrl,
    runId,
    ...options,
    queuedAt: new Date().toISOString()
  };

  try {
    // Update status to queued with new runId
    await UserModel.findByIdAndUpdate(userId, {
      'jobSeeker.resumeParseStatus': 'queued',
      'jobSeeker.resumeParseRunId': runId,
      'jobSeeker.resumeParseError': null
    });
    
    console.log(`📋 Parse job created with runId: ${runId}`);

    if (isUsingRedis && resumeQueue) {
      // Use BullMQ with Redis
      const job = await resumeQueue.add('parse-resume', jobData, {
        attempts: 2, // Retry once on failure
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 3600, count: 100 }, // Keep for 1 hour
        removeOnFail: { age: 86400, count: 1000 }, // Keep failures for 24 hours
        timeout: 30000 // 30 second timeout per attempt
      });

      console.log(`📋 Resume parse job queued with Redis: ${job.id}`);
      return job.id;
    } else {
      // Use setImmediate for async execution (in-memory fallback)
      console.log(`📋 Resume parse job queued in-memory (userId: ${userId})`);
      
      setImmediate(async () => {
        try {
          await processResumeParseJob(jobData);
        } catch (error) {
          console.error('❌ In-memory job processing failed:', error);
        }
      });

      return `in-memory-${userId}-${Date.now()}`;
    }
  } catch (error) {
    console.error('❌ Failed to queue resume parse job:', error);
    
    // Update status to failed
    await UserModel.findByIdAndUpdate(userId, {
      'jobSeeker.resumeParseStatus': 'failed',
      'jobSeeker.resumeParseError': `Queue error: ${error.message}`
    });

    throw error;
  }
};

/**
 * Process a resume parse job
 * 
 * @param {object} jobData - Job data with userId, resumeUrl, etc.
 */
const processResumeParseJob = async (jobData) => {
  const { userId, resumeUrl, resumePublicId, resumeBuffer, originalName } = jobData;
  
  console.log('\n========================================');
  console.log('🤖 BACKGROUND RESUME PARSING STARTED');
  console.log('========================================');
  console.log('👤 User ID:', userId);
  console.log('📄 Resume URL:', resumeUrl ? '✓' : '✗');
  console.log('📄 Resume Buffer:', resumeBuffer ? '✓' : '✗');
  console.log('⏰ Started at:', new Date().toISOString());

  try {
    // Update status to processing
    await UserModel.findByIdAndUpdate(userId, {
      'jobSeeker.resumeParseStatus': 'processing',
      'jobSeeker.resumeParseError': null
    });

    console.log('📊 Status updated to: processing');

    // Call parser service with timeout
    const parsePromise = resumeParserService.parseAndAutofillProfile(
      userId,
      resumeUrl || resumeBuffer,
      {
        method: resumeUrl ? 'url' : 'buffer',
        filename: originalName,
        isBackgroundJob: true
      }
    );

    // Add timeout wrapper (15 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Parsing timeout after 15 seconds')), 15000);
    });

    const updatedUser = await Promise.race([parsePromise, timeoutPromise]);

    if (updatedUser) {
      console.log('\n✅ ============================================');
      console.log('✅ BACKGROUND PARSING COMPLETED SUCCESSFULLY');
      console.log('✅ ============================================');
      console.log('✅ Skills:', updatedUser.jobSeeker?.skills?.length || 0);
      console.log('✅ Education:', updatedUser.jobSeeker?.education ? 'Added' : 'Empty');
      console.log('✅ Experience:', updatedUser.jobSeeker?.experience ? 'Added' : 'Empty');
      console.log('✅ Status:', 'done');
      console.log('========================================\n');
      
      // Status is already updated by parseAndAutofillProfile
      return updatedUser;
    } else {
      console.warn('\n⚠️  Parser returned null - marking as failed');
      
      await UserModel.findByIdAndUpdate(userId, {
        'jobSeeker.resumeParseStatus': 'failed',
        'jobSeeker.resumeParseError': 'Parser returned no data'
      });

      return null;
    }
  } catch (error) {
    console.error('\n❌ ============================================');
    console.error('❌ BACKGROUND PARSING FAILED');
    console.error('❌ ============================================');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('========================================\n');

    // Update status to failed with error message
    await UserModel.findByIdAndUpdate(userId, {
      'jobSeeker.resumeParseStatus': 'failed',
      'jobSeeker.resumeParseError': error.message || 'Unknown error during parsing'
    });

    throw error; // Re-throw for BullMQ retry mechanism
  }
};

/**
 * Get queue status (for monitoring)
 */
const getQueueStatus = async () => {
  if (isUsingRedis && resumeQueue) {
    const counts = await resumeQueue.getJobCounts();
    return {
      type: 'redis',
      ...counts
    };
  }

  return {
    type: 'in-memory',
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  };
};

module.exports = {
  initializeQueue,
  queueResumeParseJob,
  getQueueStatus,
  isUsingRedis: () => isUsingRedis
};
