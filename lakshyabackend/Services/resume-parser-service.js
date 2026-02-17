const axios = require('axios');
const FormData = require('form-data');
const UserModel = require('../models/user-model');

// Resume parser service configuration
const RESUME_PARSER_URL = process.env.RESUME_PARSER_URL || 'http://localhost:8000';
const PARSER_TIMEOUT = 30000; // 30 seconds timeout

/**
 * Call Python resume parser service with a signed URL.
 * PRIMARY METHOD - use this for authenticated Cloudinary resumes.
 *
 * @param {string} signedResumeUrl - Cloudinary signed URL (valid for 1+ hours)
 * @returns {Promise<Object|null>} Parsed resume data or null on failure
 */
const callResumeParser = async (signedResumeUrl) => {
  try {
    console.log('\n=== CALLING RESUME PARSER SERVICE (signed URL) ===');
    console.log('📍 Parser URL:', RESUME_PARSER_URL);
    console.log('📡 Endpoint:', `${RESUME_PARSER_URL}/parse-resume`);
    console.log('📄 Resume URL (first 80 chars):', signedResumeUrl.substring(0, 80) + '...');
    console.log('⏱️  Timeout:', PARSER_TIMEOUT, 'ms');
    
    const requestBody = { resumeUrl: signedResumeUrl };
    console.log('📤 Sending request...');

    const response = await axios.post(
      `${RESUME_PARSER_URL}/parse-resume`,
      requestBody,
      {
        timeout: PARSER_TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ Parser response status:', response.status);
    console.log('✅ Parser response headers:', response.headers);
    console.log('📦 Parser response data:', JSON.stringify(response.data, null, 2));
    console.log('🔍 Data type:', typeof response.data);
    console.log('🔍 Has skills?', Array.isArray(response.data?.skills));
    console.log('🔍 Skills count:', response.data?.skills?.length || 0);
    console.log('🔍 Skills values:', response.data?.skills);

    return response.data;
  } catch (error) {
    console.error('\n❌ ================================================');
    console.error('❌ RESUME PARSER SERVICE ERROR (URL METHOD)');
    console.error('❌ ================================================');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Parser URL:', RESUME_PARSER_URL);

    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Resume parser service is not running on', RESUME_PARSER_URL);
      console.error('   Start it with: cd resume-parser-service && venv\\Scripts\\activate && python main.py');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⚠️  Parser service timed out after', PARSER_TIMEOUT, 'ms');
    } else if (error.response) {
      console.error('⚠️  Parser service returned HTTP error:');
      console.error('   Status:', error.response.status);
      console.error('   Status text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      console.error('   Headers:', error.response.headers);
    } else if (error.request) {
      console.error('⚠️  Request was sent but no response received');
      console.error('   This might be a network/firewall issue');
    }
    console.error('================================================\n');

    return null;
  }
};

/**
 * Call Python resume parser service by sending the file buffer directly.
 * FALLBACK METHOD - use if signed URL fails.
 *
 * @param {Buffer} fileBuffer - Raw file bytes (from multer memoryStorage)
 * @param {string} originalName - Original filename (e.g. "resume.pdf")
 * @returns {Promise<Object|null>} Parsed resume data or null on failure
 */
const callResumeParserWithFile = async (fileBuffer, originalName) => {
  try {
    console.log('=== CALLING RESUME PARSER SERVICE (file upload) ===');
    console.log('File:', originalName, '| Size:', fileBuffer.length, 'bytes');
    console.log('Parser endpoint:', `${RESUME_PARSER_URL}/parse-resume-file`);

    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: originalName,
      contentType: originalName.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const response = await axios.post(
      `${RESUME_PARSER_URL}/parse-resume-file`,
      form,
      {
        timeout: PARSER_TIMEOUT,
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Parser response status:', response.status);
    console.log('Parser response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('❌ Resume parser service error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Resume parser service is not running on', RESUME_PARSER_URL);
      console.error('   Start it with: cd resume-parser-service && venv\\Scripts\\activate && python main.py');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⚠️  Parser service timed out after', PARSER_TIMEOUT, 'ms');
    } else if (error.response) {
      console.error('⚠️  Parser service returned error:');
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }

    return null;
  }
};

/**
 * Parse resume and auto-fill job seeker profile.
 * Only fills fields that are currently empty (doesn't overwrite existing data).
 * Tracks parsing status in database.
 *
 * @param {string} userId - User ID
 * @param {string|Buffer} resumeData - Either URL (string) or file buffer (Buffer)
 * @param {object} options - { method: 'url' | 'buffer', filename?: string, isBackgroundJob?: boolean }
 * @returns {Promise<Object|null>} Updated user object or null
 */
const parseAndAutofillProfile = async (userId, resumeData, options = {}) => {
  try {
    console.log('\n=== PARSE AND AUTOFILL PROFILE ===');
    console.log('👤 User ID:', userId);
    console.log('🔧 Method:', options.method || 'auto-detect');
    console.log('🔧 Background job:', !!options.isBackgroundJob);
    console.log('📊 Resume data type:', typeof resumeData);
    console.log('📊 Is Buffer:', Buffer.isBuffer(resumeData));
    console.log('📊 Is String:', typeof resumeData === 'string');

    let parsedData = null;

    // Call parser based on method
    if (options.method === 'url' || typeof resumeData === 'string') {
      console.log('✅ Using URL method');
      parsedData = await callResumeParser(resumeData);
    } else if (options.method === 'buffer' || Buffer.isBuffer(resumeData)) {
      console.log('✅ Using buffer upload method');
      const filename = options.filename || 'resume.pdf';
      parsedData = await callResumeParserWithFile(resumeData, filename);
    } else {
      console.error('❌ Invalid resumeData type:', typeof resumeData);
      return null;
    }
    
    if (!parsedData) {
      console.warn('\n⚠️  Parser returned null - marking as failed');
      
      // Update status to failed
      await UserModel.findByIdAndUpdate(userId, {
        'jobSeeker.resumeParseStatus': 'failed',
        'jobSeeker.resumeParseError': 'Parser service did not return data'
      });
      
      return null;
    }
    
    console.log('\n📊 ========================================');
    console.log('📊 PARSED DATA RECEIVED');
    console.log('📊 ========================================');
    console.log('📊 Title:', parsedData.title || '(none)');
    console.log('📊 Skills count:', parsedData.skills?.length || 0);
    console.log('📊 Education found:', parsedData.educationFound || !!parsedData.education);
    console.log('📊 Education length:', parsedData.education?.length || 0);
    console.log('📊 Experience found:', parsedData.experienceFound || !!parsedData.experience);
    console.log('📊 Experience length:', parsedData.experience?.length || 0);
    console.log('📊 Summary:', parsedData.summary ? `${parsedData.summary.substring(0, 50)}...` : '(none)');
    console.log('========================================\n');
    
    // Get current user data
    const user = await UserModel.findById(userId).select('-password -resetOTP -resetOTPExpiry');
    
    if (!user) {
      console.error('❌ User not found:', userId);
      return null;
    }
    
    console.log('\n📋 CURRENT PROFILE STATE:');
    console.log('Title:', user.jobSeeker?.title || '(empty)');
    console.log('Skills:', user.jobSeeker?.skills?.length || 0);
    console.log('Education:', user.jobSeeker?.education ? 'exists' : '(empty)');
    console.log('Experience:', user.jobSeeker?.experience ? 'exists' : '(empty)');
    console.log('Bio:', user.jobSeeker?.bio ? 'exists' : '(empty)');
    
    // Prepare updates
    const updates = {};
    const summary = {
      skillsAdded: 0,
      educationFilled: false,
      experienceFilled: false,
      bioFilled: false,
      titleFilled: false
    };
    
    // Title: only if empty
    if (parsedData.title && !user.jobSeeker?.title) {
      updates['jobSeeker.title'] = parsedData.title;
      summary.titleFilled = true;
      console.log('✓ Adding title:', parsedData.title);
    }
    
    // Skills: merge with existing (unique, case-insensitive)
    if (parsedData.skills && parsedData.skills.length > 0) {
      const existingSkills = (user.jobSeeker?.skills || []).map(s => s.toLowerCase());
      const newSkillsToAdd = parsedData.skills.filter(
        skill => !existingSkills.includes(skill.toLowerCase())
      );
      
      if (newSkillsToAdd.length > 0) {
        const mergedSkills = [...(user.jobSeeker?.skills || []), ...newSkillsToAdd];
        updates['jobSeeker.skills'] = mergedSkills;
        summary.skillsAdded = newSkillsToAdd.length;
        console.log(`✓ Adding ${newSkillsToAdd.length} new skills:`, newSkillsToAdd);
      }
    }
    
    // Education: only if empty
    if (parsedData.education && !user.jobSeeker?.education) {
      updates['jobSeeker.education'] = parsedData.education;
      summary.educationFilled = true;
      console.log('✓ Adding education:', parsedData.education.substring(0, 60) + '...');
    }
    
    // Experience: only if empty
    if (parsedData.experience && !user.jobSeeker?.experience) {
      updates['jobSeeker.experience'] = parsedData.experience;
      summary.experienceFilled = true;
      console.log('✓ Adding experience:', parsedData.experience.substring(0, 60) + '...');
    }
    
    // Bio: only if empty
    if (parsedData.summary && !user.jobSeeker?.bio) {
      updates['jobSeeker.bio'] = parsedData.summary;
      summary.bioFilled = true;
      console.log('✓ Adding bio:', parsedData.summary.substring(0, 60) + '...');
    }
    
    // Update status fields (preserve runId from when job was queued)
    updates['jobSeeker.resumeParseStatus'] = 'done';
    updates['jobSeeker.resumeParseError'] = null;
    updates['jobSeeker.resumeParsedAt'] = new Date();
    updates['jobSeeker.resumeParseResultSummary'] = summary;
    // Keep existing runId - don't overwrite it
    
    console.log('\n💾 ========================================');
    console.log('💾 APPLYING UPDATES TO DATABASE');
    console.log('💾 ========================================');
    console.log('💾 User ID:', userId);
    console.log('💾 Total fields to update:', Object.keys(updates).length);
    console.log('💾 Updates object:', JSON.stringify(updates, null, 2));
    console.log('💾 Summary:', JSON.stringify(summary, null, 2));
    console.log('========================================\n');
    
    // Update user profile with $set to ensure data persists
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: false } // Return updated doc, skip validation for nested updates
    ).select('-password -resetOTP -resetOTPExpiry');
    
    if (!updatedUser) {
      console.error('❌ Database update failed - user not found or update error');
      return null;
    }
    
    // CRITICAL: Verify the data was actually saved
    console.log('\n🔍 ========================================');
    console.log('🔍 VERIFYING SAVED DATA');
    console.log('🔍 ========================================');
    console.log('🔍 Saved skills count:', updatedUser.jobSeeker?.skills?.length || 0);
    console.log('🔍 Saved skills:', updatedUser.jobSeeker?.skills || []);
    console.log('🔍 Saved education:', updatedUser.jobSeeker?.education ? 'YES' : 'NO');
    console.log('🔍 Saved experience:', updatedUser.jobSeeker?.experience ? 'YES' : 'NO');
    console.log('🔍 Saved status:', updatedUser.jobSeeker?.resumeParseStatus);
    console.log('🔍 Saved runId:', updatedUser.jobSeeker?.resumeParseRunId);
    console.log('🔍 Saved summary:', updatedUser.jobSeeker?.resumeParseResultSummary);
    console.log('========================================\n');
    
    // DOUBLE-CHECK: Fetch from DB again to ensure persistence
    const refetchedUser = await UserModel.findById(userId).select('jobSeeker.skills jobSeeker.resumeParseStatus jobSeeker.resumeParseResultSummary');
    console.log('\n🔎 ========================================');
    console.log('🔎 DOUBLE-CHECK: REFETCHING FROM DATABASE');
    console.log('🔎 ========================================');
    console.log('🔎 Skills count after refetch:', refetchedUser.jobSeeker?.skills?.length || 0);
    console.log('🔎 Skills after refetch:', refetchedUser.jobSeeker?.skills || []);
    console.log('🔎 Status after refetch:', refetchedUser.jobSeeker?.resumeParseStatus);
    console.log('🔎 Summary after refetch:', refetchedUser.jobSeeker?.resumeParseResultSummary);
    
    // CRITICAL ERROR CHECK
    const expectedCount = summary.skillsAdded;
    const actualCount = refetchedUser.jobSeeker?.skills?.length || 0;
    const existingCount = user.jobSeeker?.skills?.length || 0;
    const finalExpectedCount = existingCount + expectedCount;
    
    if (actualCount !== finalExpectedCount) {
      console.error('❌❌❌ CRITICAL ERROR: SKILLS COUNT MISMATCH ❌❌❌');
      console.error('Expected total skills:', finalExpectedCount);
      console.error('Actual total skills:', actualCount);
      console.error('Previous skills:', existingCount);
      console.error('New skills added:', expectedCount);
      console.error('This means the database update FAILED or was PARTIAL!');
      console.error('========================================\n');
    } else {
      console.log('✅ Skills count verification PASSED');
    }
    console.log('========================================\n');
    
    console.log('\n✅ ========================================');
    console.log('✅ AUTO-FILL COMPLETE');
    console.log('✅ ========================================');
    console.log('✅ Skills added:', summary.skillsAdded);
    console.log('✅ Education filled:', summary.educationFilled);
    console.log('✅ Experience filled:', summary.experienceFilled);
    console.log('✅ Status: done');
    console.log('========================================\n');
    
    return updatedUser;
    
  } catch (error) {
    console.error('❌ Auto-fill error:', error.message);
    console.error(error.stack);
    
    // Update status to failed
    try {
      await UserModel.findByIdAndUpdate(userId, {
        'jobSeeker.resumeParseStatus': 'failed',
        'jobSeeker.resumeParseError': error.message || 'Unknown error during parsing'
      });
    } catch (updateError) {
      console.error('❌ Failed to update error status:', updateError.message);
    }
    
    return null;
  }
};

/**
 * Check if resume parser service is healthy
 * @returns {Promise<boolean>}
 */
const checkParserServiceHealth = async () => {
  try {
    const response = await axios.get(`${RESUME_PARSER_URL}/`, { timeout: 5000 });
    return response.data?.status === 'healthy' && response.data?.spacy_loaded === true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  callResumeParser,
  callResumeParserWithFile,
  parseAndAutofillProfile,
  checkParserServiceHealth
};
