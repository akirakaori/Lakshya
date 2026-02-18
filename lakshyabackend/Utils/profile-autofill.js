/**
 * Smart Resume Autofill Utility
 * 
 * Intelligently merges resume analysis data with existing profile data.
 * RULE: Only fill EMPTY fields. Never overwrite existing values.
 * 
 * @module profile-autofill
 */

/**
 * Check if a value is empty (null, undefined, empty string, or whitespace only)
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (10-15 digits)
 * @param {string} phone - Phone to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Merge skills arrays (case-insensitive, no duplicates)
 * @param {string[]} existingSkills - Current skills
 * @param {string[]} newSkills - Skills from resume
 * @returns {Object} - { mergedSkills, addedSkills }
 */
const mergeSkills = (existingSkills = [], newSkills = []) => {
  const existing = existingSkills.map(s => s.trim());
  const existingLower = existing.map(s => s.toLowerCase());
  
  const addedSkills = [];
  
  for (const skill of newSkills) {
    const trimmed = skill.trim();
    if (trimmed && !existingLower.includes(trimmed.toLowerCase())) {
      existing.push(trimmed);
      addedSkills.push(trimmed);
    }
  }
  
  return {
    mergedSkills: existing,
    addedSkills
  };
};

/**
 * Parse experience/education strings into structured entries
 * Simple heuristic: split by double newlines or numbered lists
 * @param {string} text - Experience/education text
 * @returns {Array} - Array of entry objects
 */
const parseEntries = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Split by double newlines or numbered patterns
  const entries = text
    .split(/\n\n+|\n\d+\.\s+/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
  
  return entries.map(entry => ({
    text: entry,
    normalized: entry.toLowerCase().replace(/\s+/g, ' ')
  }));
};

/**
 * Check if two experience/education entries are duplicates
 * @param {string} entry1 - First entry text
 * @param {string} entry2 - Second entry text
 * @returns {boolean} - True if duplicate
 */
const isDuplicateEntry = (entry1, entry2) => {
  const normalize = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  };
  
  const norm1 = normalize(entry1);
  const norm2 = normalize(entry2);
  
  if (norm1 === norm2) return true;
  
  // Check if one contains the other (80% threshold)
  const shorter = norm1.length < norm2.length ? norm1 : norm2;
  const longer = norm1.length < norm2.length ? norm2 : norm1;
  
  if (shorter.length > 20 && longer.includes(shorter)) {
    return true;
  }
  
  return false;
};

/**
 * Merge experience or education entries
 * @param {string} existing - Existing text
 * @param {string} newText - New text from resume
 * @returns {Object} - { mergedText, addedEntries, skippedDuplicates }
 */
const mergeTextEntries = (existing, newText) => {
  const result = {
    mergedText: existing || '',
    addedEntries: [],
    skippedDuplicates: 0
  };
  
  if (isEmpty(newText)) {
    return result;
  }
  
  if (isEmpty(existing)) {
    result.mergedText = newText;
    result.addedEntries = parseEntries(newText).map(e => e.text);
    return result;
  }
  
  const existingEntries = parseEntries(existing);
  const newEntries = parseEntries(newText);
  
  const entriesText = [existing];
  
  for (const newEntry of newEntries) {
    const isDup = existingEntries.some(existingEntry => 
      isDuplicateEntry(existingEntry.text, newEntry.text)
    );
    
    if (!isDup) {
      entriesText.push(newEntry.text);
      result.addedEntries.push(newEntry.text);
      existingEntries.push(newEntry); // Add to avoid duplicate detection with other new entries
    } else {
      result.skippedDuplicates++;
    }
  }
  
  result.mergedText = entriesText.join('\n\n');
  
  return result;
};

/**
 * Main merge function: Merge resume analysis data with existing profile
 * 
 * @param {Object} profile - Existing profile data from database
 * @param {Object} analysis - Resume analysis data from parser
 * @returns {Object} - { updatedProfile, changes }
 */
const mergeProfile = (profile, analysis) => {
  console.log('\n🤖 ========================================');
  console.log('🤖 SMART RESUME AUTOFILL - MERGE STARTING');
  console.log('🤖 ========================================');
  
  const changes = [];
  const updatedProfile = { ...profile };
  
  // IMPORTANT: Deep clone jobSeeker to avoid modifying the original object
  if (!updatedProfile.jobSeeker) {
    updatedProfile.jobSeeker = {};
  } else {
    updatedProfile.jobSeeker = JSON.parse(JSON.stringify(updatedProfile.jobSeeker));
  }
  
  // Track what we're starting with
  console.log('📊 Current Profile State:');
  console.log('  Name:', profile.name || '(empty)');
  console.log('  Email:', profile.email || '(empty)');
  console.log('  Phone:', profile.number || '(empty)');
  console.log('  Title:', profile.jobSeeker?.title || '(empty)');
  console.log('  Bio:', profile.jobSeeker?.bio ? `${profile.jobSeeker.bio.length} chars` : '(empty)');
  console.log('  Skills:', profile.jobSeeker?.skills?.length || 0);
  console.log('  Experience:', profile.jobSeeker?.experience ? `${profile.jobSeeker.experience.length} chars` : '(empty)');
  console.log('  Education:', profile.jobSeeker?.education ? `${profile.jobSeeker.education.length} chars` : '(empty)');
  
  console.log('\n📄 Resume Analysis Data:');
  console.log('  Name:', analysis.name || '(not provided)');
  console.log('  Email:', analysis.email || '(not provided)');
  console.log('  Phone:', analysis.phone || '(not provided)');
  console.log('  Title:', analysis.title || '(not provided)');
  console.log('  Summary:', analysis.summary ? `${analysis.summary.length} chars` : '(not provided)');
  console.log('  Skills:', analysis.skills?.length || 0);
  console.log('  Experience:', analysis.experience ? `${analysis.experience.length} chars` : '(not provided)');
  console.log('  Education:', analysis.education ? `${analysis.education.length} chars` : '(not provided)');
  
  console.log('\n🔄 Processing fields...\n');
  
  // ============================================
  // 1. NAME
  // ============================================
  if (!isEmpty(analysis.name) && isEmpty(profile.name)) {
    updatedProfile.name = analysis.name.trim();
    changes.push({
      field: 'name',
      action: 'filled',
      value: analysis.name.trim(),
      reason: 'Field was empty'
    });
    console.log('✅ NAME: Filled with "' + analysis.name.trim() + '"');
  } else if (!isEmpty(analysis.name) && !isEmpty(profile.name)) {
    changes.push({
      field: 'name',
      action: 'skipped',
      reason: 'Already has value: "' + profile.name + '"'
    });
    console.log('⏭️  NAME: Skipped (already has value)');
  }
  
  // ============================================
  // 2. EMAIL
  // ============================================
  if (!isEmpty(analysis.email) && isEmpty(profile.email)) {
    if (isValidEmail(analysis.email)) {
      updatedProfile.email = analysis.email.trim().toLowerCase();
      changes.push({
        field: 'email',
        action: 'filled',
        value: analysis.email.trim().toLowerCase(),
        reason: 'Field was empty and email is valid'
      });
      console.log('✅ EMAIL: Filled with "' + analysis.email.trim() + '"');
    } else {
      changes.push({
        field: 'email',
        action: 'skipped',
        reason: 'Invalid email format: "' + analysis.email + '"'
      });
      console.log('❌ EMAIL: Skipped (invalid format)');
    }
  } else if (!isEmpty(analysis.email) && !isEmpty(profile.email)) {
    changes.push({
      field: 'email',
      action: 'skipped',
      reason: 'Already has value: "' + profile.email + '"'
    });
    console.log('⏭️  EMAIL: Skipped (already has value)');
  }
  
  // ============================================
  // 3. PHONE
  // ============================================
  if (!isEmpty(analysis.phone) && isEmpty(profile.number)) {
    if (isValidPhone(analysis.phone)) {
      updatedProfile.number = analysis.phone.trim();
      changes.push({
        field: 'phone',
        action: 'filled',
        value: analysis.phone.trim(),
        reason: 'Field was empty and phone is valid'
      });
      console.log('✅ PHONE: Filled with "' + analysis.phone.trim() + '"');
    } else {
      changes.push({
        field: 'phone',
        action: 'skipped',
        reason: 'Invalid phone format: "' + analysis.phone + '"'
      });
      console.log('❌ PHONE: Skipped (invalid format)');
    }
  } else if (!isEmpty(analysis.phone) && !isEmpty(profile.number)) {
    changes.push({
      field: 'phone',
      action: 'skipped',
      reason: 'Already has value: "' + profile.number + '"'
    });
    console.log('⏭️  PHONE: Skipped (already has value)');
  }
  
  // ============================================
  // 4. PROFESSIONAL TITLE
  // ============================================
  if (!isEmpty(analysis.title) && isEmpty(profile.jobSeeker?.title)) {
    updatedProfile.jobSeeker.title = analysis.title.trim();
    changes.push({
      field: 'title',
      action: 'filled',
      value: analysis.title.trim(),
      reason: 'Field was empty'
    });
    console.log('✅ TITLE: Filled with "' + analysis.title.trim() + '"');
  } else if (!isEmpty(analysis.title) && !isEmpty(profile.jobSeeker?.title)) {
    changes.push({
      field: 'title',
      action: 'skipped',
      reason: 'Already has value: "' + profile.jobSeeker.title + '"'
    });
    console.log('⏭️  TITLE: Skipped (already has value)');
  }
  
  // ============================================
  // 5. PROFESSIONAL SUMMARY / BIO
  // ============================================
  if (!isEmpty(analysis.summary) && isEmpty(profile.jobSeeker?.bio)) {
    updatedProfile.jobSeeker.bio = analysis.summary.trim();
    changes.push({
      field: 'bio',
      action: 'filled',
      value: analysis.summary.trim(),
      reason: 'Field was empty'
    });
    console.log('✅ BIO: Filled (' + analysis.summary.length + ' chars)');
  } else if (!isEmpty(analysis.summary) && !isEmpty(profile.jobSeeker?.bio)) {
    changes.push({
      field: 'bio',
      action: 'skipped',
      reason: 'Already has value (' + profile.jobSeeker.bio.length + ' chars)'
    });
    console.log('⏭️  BIO: Skipped (already has value)');
  }
  
  // ============================================
  // 6. SKILLS (Special handling: merge, no duplicates)
  // ============================================
  if (analysis.skills && analysis.skills.length > 0) {
    const { mergedSkills, addedSkills } = mergeSkills(
      profile.jobSeeker?.skills || [],
      analysis.skills
    );
    
    if (addedSkills.length > 0) {
      updatedProfile.jobSeeker.skills = mergedSkills;
      changes.push({
        field: 'skills',
        action: 'appended',
        value: addedSkills,
        reason: `Added ${addedSkills.length} new skills (${analysis.skills.length - addedSkills.length} duplicates skipped)`
      });
      console.log(`✅ SKILLS: Added ${addedSkills.length} new skills:`, addedSkills);
      console.log(`   Total skills now: ${mergedSkills.length}`);
    } else {
      changes.push({
        field: 'skills',
        action: 'skipped',
        reason: 'All skills already exist'
      });
      console.log('⏭️  SKILLS: All skills already exist');
    }
  }
  
  // ============================================
  // 7. EXPERIENCE (Append if not duplicate)
  // ============================================
  if (!isEmpty(analysis.experience)) {
    const mergeResult = mergeTextEntries(
      profile.jobSeeker?.experience,
      analysis.experience
    );
    
    if (mergeResult.addedEntries.length > 0) {
      updatedProfile.jobSeeker.experience = mergeResult.mergedText;
      changes.push({
        field: 'experience',
        action: 'appended',
        value: mergeResult.addedEntries,
        reason: `Added ${mergeResult.addedEntries.length} new entries (${mergeResult.skippedDuplicates} duplicates skipped)`
      });
      console.log(`✅ EXPERIENCE: Added ${mergeResult.addedEntries.length} new entries`);
    } else if (isEmpty(profile.jobSeeker?.experience)) {
      // This case is handled in mergeTextEntries, but let's be explicit
      updatedProfile.jobSeeker.experience = mergeResult.mergedText;
      changes.push({
        field: 'experience',
        action: 'filled',
        reason: 'Field was empty'
      });
      console.log('✅ EXPERIENCE: Filled (was empty)');
    } else {
      changes.push({
        field: 'experience',
        action: 'skipped',
        reason: 'All entries are duplicates'
      });
      console.log('⏭️  EXPERIENCE: All entries are duplicates');
    }
  }
  
  // ============================================
  // 8. EDUCATION (Append if not duplicate)
  // ============================================
  if (!isEmpty(analysis.education)) {
    const mergeResult = mergeTextEntries(
      profile.jobSeeker?.education,
      analysis.education
    );
    
    if (mergeResult.addedEntries.length > 0) {
      updatedProfile.jobSeeker.education = mergeResult.mergedText;
      changes.push({
        field: 'education',
        action: 'appended',
        value: mergeResult.addedEntries,
        reason: `Added ${mergeResult.addedEntries.length} new entries (${mergeResult.skippedDuplicates} duplicates skipped)`
      });
      console.log(`✅ EDUCATION: Added ${mergeResult.addedEntries.length} new entries`);
    } else if (isEmpty(profile.jobSeeker?.education)) {
      updatedProfile.jobSeeker.education = mergeResult.mergedText;
      changes.push({
        field: 'education',
        action: 'filled',
        reason: 'Field was empty'
      });
      console.log('✅ EDUCATION: Filled (was empty)');
    } else {
      changes.push({
        field: 'education',
        action: 'skipped',
        reason: 'All entries are duplicates'
      });
      console.log('⏭️  EDUCATION: All entries are duplicates');
    }
  }
  
  console.log('\n📋 ========================================');
  console.log('📋 MERGE SUMMARY');
  console.log('📋 ========================================');
  console.log(`📋 Total changes tracked: ${changes.length}`);
  console.log(`📋 Fields filled: ${changes.filter(c => c.action === 'filled').length}`);
  console.log(`📋 Fields appended: ${changes.filter(c => c.action === 'appended').length}`);
  console.log(`📋 Fields skipped: ${changes.filter(c => c.action === 'skipped').length}`);
  console.log('📋 ========================================\n');
  
  return {
    updatedProfile,
    changes
  };
};

module.exports = {
  mergeProfile,
  isEmpty,
  isValidEmail,
  isValidPhone,
  mergeSkills,
  mergeTextEntries
};
