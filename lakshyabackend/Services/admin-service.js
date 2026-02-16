const UserModel = require("../models/user-model");
const JobModel = require("../models/job-model");
const AuditLogModel = require("../models/audit-log");
const jobService = require("./job-service");
const bcrypt = require('bcrypt');

/**
 * Helper function to create audit log
 * @private
 */
const createAuditLog = async (performedBy, performedByName, targetId, targetType, actionType, details, changes = null) => {
  try {
    await AuditLogModel.create({
      performedBy,
      performedByName,
      targetId,
      targetType,
      actionType,
      details,
      changes
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
};

/**
 * Service function to get all users
 * @param {Object} filters - { search, role, isActive }
 * @returns {Promise<Object>} - { success: true, users: [...] }
 * @throws {Error} - Error with statusCode and message properties
 */
const getAllUsersService = async (filters = {}) => {
  const { search, role, isActive } = filters;
  
  // Build MongoDB query object
  const query = {};
  
  // EXCLUDE admin users from the list
  query.role = { $ne: 'admin' };
  
  // Text search across name and email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Filter by role (if specified and not admin)
  if (role && role !== 'admin') {
    query.role = role;
  }
  
  // Filter by isActive status
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    query.isActive = isActive === 'true' || isActive === true;
  }
  
  const users = await UserModel.find(query)
    .select("-password")
    .sort({ createdAt: -1 });
  
  return {
    success: true,
    users,
  };
};

/**
 * Service function to get all posts/jobs
 * @param {Object} filters - { search, status, isActive, jobType, company, location, page, limit }
 * @returns {Promise<Object>} - { success: true, posts: [...], page, limit, total, totalPages }
 * @throws {Error} - Error with statusCode and message properties
 */
const getAllPostsService = async (filters = {}) => {
  const { search, status, isActive, jobType, company, location, page = 1, limit = 50 } = filters;
  
  // Build MongoDB query object
  const query = {};
  
  // Text search across title, companyName, and location
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Filter by status (JobModel uses 'open' or 'closed')
  if (status) {
    query.status = status;
  }
  
  // Note: JobModel doesn't have isActive field, we use status instead
  // If isActive is specified, map to status
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    const activeStatus = isActive === 'true' || isActive === true;
    query.status = activeStatus ? 'open' : 'closed';
  }
  
  // Filter by jobType
  if (jobType) {
    query.jobType = jobType;
  }
  
  // Filter by company (exact match)
  if (company && !search) {
    query.companyName = { $regex: company, $options: 'i' };
  }
  
  // Filter by location (exact match)
  if (location && !search) {
    query.location = { $regex: location, $options: 'i' };
  }
  
  // Get total count for pagination
  const total = await JobModel.countDocuments(query);
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  const jobs = await JobModel.find(query)
    .populate("createdBy", "name email role recruiter")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Format jobs to match frontend expectations (map companyName to company)
  const formattedPosts = jobs.map(job => ({
    _id: job._id,
    title: job.title,
    description: job.description,
    company: job.companyName, // Map companyName to company for frontend
    location: job.location,
    salary: job.salary ? `${job.salary.currency} ${job.salary.min || ''}-${job.salary.max || ''}`.trim() : '',
    jobType: job.jobType,
    createdByName: job.createdBy?.name || 'Unknown',
    createdByEmail: job.createdBy?.email || '',
    status: job.status,
    isActive: job.isActive, // Use actual isActive field
    isDeleted: job.isDeleted, // Include isDeleted flag
    editedByAdmin: false, // JobModel doesn't have this field
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  }));
  
  return {
    success: true,
    posts: formattedPosts,
    page,
    limit,
    total,
    totalPages
  };
};

/**
 * Service function to delete a post/job (soft delete)
 * @param {Object} data - { adminUser: { id, name }, id, reason }
 * @returns {Promise<Object>} - { success: true, message: "..." }
 * @throws {Error} - Error with statusCode and message properties
 */
const deletePostService = async (data) => {
  const { adminUser, id, reason } = data;
  
  // Use the jobService softDeleteJob method with admin privileges
  const job = await jobService.softDeleteJob(id, adminUser.id, true);
  
  // Create audit log
  await createAuditLog(
    adminUser.id,
    adminUser.name || 'Admin',
    id,
    'Job',
    'delete_job',
    reason || 'Job deleted by admin',
    { jobTitle: job.title, company: job.companyName }
  );
  
  return {
    success: true,
    message: "Job deleted successfully",
  };
};

/**
 * Service function to edit a user
 * @param {Object} data - { adminUser: { id, name }, id, role, isActive, password }
 * @returns {Promise<Object>} - { success: true, message: "...", user: {...} }
 * @throws {Error} - Error with statusCode and message properties
 */
const editUserService = async (data) => {
  const { adminUser, id, role, isActive, password } = data;
  
  const user = await UserModel.findById(id);
  
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  
  const changes = {};
  const oldValues = {};
  
  if (role && role !== user.role) {
    oldValues.role = user.role;
    user.role = role;
    changes.role = `Changed from ${oldValues.role} to ${role}`;
  }
  
  if (typeof isActive !== 'undefined' && isActive !== user.isActive) {
    oldValues.isActive = user.isActive;
    user.isActive = isActive;
    changes.isActive = isActive ? 'Account activated' : 'Account suspended';
  }
  
  if (password) {
    user.password = await bcrypt.hash(password, 10);
    changes.password = 'Password reset by admin';
  }
  
  await user.save();
  
  // Create audit log
  const actionType = typeof isActive !== 'undefined' ? (isActive ? 'activate_user' : 'suspend_user') : 'edit_user';
  await createAuditLog(
    adminUser.id,
    adminUser.name || 'Admin',
    id,
    'User',
    actionType,
    Object.values(changes).join(', '),
    { oldValues, newValues: { role, isActive } }
  );
  
  return {
    success: true,
    message: "User updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  };
};

/**
 * Service function to delete a user (soft delete)
 * @param {Object} data - { adminUser: { id, name }, id, reason }
 * @returns {Promise<Object>} - { success: true, message: "..." }
 * @throws {Error} - Error with statusCode and message properties
 */
const deleteUserService = async (data) => {
  const { adminUser, id, reason } = data;
  
  const user = await UserModel.findById(id);
  
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  
  // Prevent deleting admins
  if (user.role === 'admin') {
    const error = new Error("Cannot delete admin users");
    error.statusCode = 403;
    throw error;
  }
  
  // Soft delete
  user.isActive = false;
  await user.save();
  
  // Create audit log
  await createAuditLog(
    adminUser.id,
    adminUser.name || 'Admin',
    id,
    'User',
    'delete_user',
    reason || 'User deleted by admin',
    { userName: user.name, email: user.email, role: user.role }
  );
  
  return {
    success: true,
    message: "User deleted successfully",
  };
};

/**
 * Service function to edit a post/job
 * @param {Object} data - { adminUser: { id, name }, id, title, description, company, location, salary, jobType }
 * @returns {Promise<Object>} - { success: true, message: "...", post: {...} }
 * @throws {Error} - Error with statusCode and message properties
 */
const editPostService = async (data) => {
  const { adminUser, id, title, description, company, location, salary, jobType } = data;
  
  const job = await JobModel.findById(id);
  
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }
  
  const changes = {};
  const oldValues = {};
  
  if (title && title !== job.title) {
    oldValues.title = job.title;
    job.title = title;
    changes.title = `Changed from "${oldValues.title}" to "${title}"`;
  }
  
  if (description && description !== job.description) {
    oldValues.description = job.description;
    job.description = description;
    changes.description = 'Description updated';
  }
  
  if (company && company !== job.companyName) {
    oldValues.companyName = job.companyName;
    job.companyName = company; // Map company to companyName
    changes.companyName = `Changed from "${oldValues.companyName}" to "${company}"`;
  }
  
  if (location && location !== job.location) {
    oldValues.location = job.location;
    job.location = location;
    changes.location = `Changed from "${oldValues.location}" to "${location}"`;
  }
  
  if (salary && salary !== job.salary) {
    oldValues.salary = job.salary;
    job.salary = salary;
    changes.salary = 'Salary updated';
  }
  
  if (jobType && jobType !== job.jobType) {
    oldValues.jobType = job.jobType;
    job.jobType = jobType;
    changes.jobType = `Changed from "${oldValues.jobType}" to "${jobType}"`;
  }
  
  // Note: JobModel doesn't have editedByAdmin field, so we skip it
  await job.save();
  
  // Create audit log
  await createAuditLog(
    adminUser.id,
    adminUser.name || 'Admin',
    id,
    'Job',
    'edit_job',
    Object.values(changes).join(', '),
    { oldValues, newValues: { title, description, company, location, salary, jobType } }
  );
  
  return {
    success: true,
    message: "Job updated successfully",
    post: job
  };
};

module.exports = {
  getAllUsersService,
  getAllPostsService,
  deletePostService,
  editUserService,
  deleteUserService,
  editPostService,
};
