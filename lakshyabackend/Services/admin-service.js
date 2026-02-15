const UserModel = require("../models/user-model");
const PostModel = require("../models/post-model");
const AuditLogModel = require("../models/audit-log");
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
 * Service function to get all posts
 * @param {Object} filters - { search, status, isActive, jobType, company, location }
 * @returns {Promise<Object>} - { success: true, posts: [...] }
 * @throws {Error} - Error with statusCode and message properties
 */
const getAllPostsService = async (filters = {}) => {
  const { search, status, isActive, jobType, company, location } = filters;
  
  // Build MongoDB query object
  const query = {};
  
  // Text search across title, company, and location
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Filter by status
  if (status) {
    query.status = status;
  }
  
  // Filter by isActive
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    query.isActive = isActive === 'true' || isActive === true;
  }
  
  // Filter by jobType
  if (jobType) {
    query.jobType = jobType;
  }
  
  // Filter by company (exact match)
  if (company && !search) {
    query.company = { $regex: company, $options: 'i' };
  }
  
  // Filter by location (exact match)
  if (location && !search) {
    query.location = { $regex: location, $options: 'i' };
  }
  
  const posts = await PostModel.find(query)
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });
  
  // Format posts to include createdByName from populated data
  const formattedPosts = posts.map(post => ({
    _id: post._id,
    title: post.title,
    description: post.description,
    company: post.company,
    location: post.location,
    salary: post.salary,
    jobType: post.jobType,
    createdByName: post.createdBy?.name || post.createdByName || 'Unknown',
    status: post.status,
    isActive: post.isActive,
    editedByAdmin: post.editedByAdmin,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  }));
  
  return {
    success: true,
    posts: formattedPosts,
  };
};

/**
 * Service function to delete a post (soft delete)
 * @param {Object} data - { adminUser: { id, name }, id, reason }
 * @returns {Promise<Object>} - { success: true, message: "..." }
 * @throws {Error} - Error with statusCode and message properties
 */
const deletePostService = async (data) => {
  const { adminUser, id, reason } = data;
  
  const post = await PostModel.findById(id);
  
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }
  
  // Soft delete
  post.isActive = false;
  post.status = 'deleted';
  await post.save();
  
  // Create audit log
  await createAuditLog(
    adminUser.id,
    adminUser.name || 'Admin',
    id,
    'Post',
    'delete_post',
    reason || 'Post deleted by admin',
    { postTitle: post.title, company: post.company }
  );
  
  return {
    success: true,
    message: "Post deleted successfully",
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
 * Service function to edit a post
 * @param {Object} data - { adminUser: { id, name }, id, title, description, company, location, salary, jobType }
 * @returns {Promise<Object>} - { success: true, message: "...", post: {...} }
 * @throws {Error} - Error with statusCode and message properties
 */
const editPostService = async (data) => {
  const { adminUser, id, title, description, company, location, salary, jobType } = data;
  
  const post = await PostModel.findById(id);
  
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }
  
  const changes = {};
  const oldValues = {};
  
  if (title && title !== post.title) {
    oldValues.title = post.title;
    post.title = title;
    changes.title = `Changed from "${oldValues.title}" to "${title}"`;
  }
  
  if (description && description !== post.description) {
    oldValues.description = post.description;
    post.description = description;
    changes.description = 'Description updated';
  }
  
  if (company && company !== post.company) {
    oldValues.company = post.company;
    post.company = company;
    changes.company = `Changed from "${oldValues.company}" to "${company}"`;
  }
  
  if (location && location !== post.location) {
    oldValues.location = post.location;
    post.location = location;
    changes.location = `Changed from "${oldValues.location}" to "${location}"`;
  }
  
  if (salary && salary !== post.salary) {
    oldValues.salary = post.salary;
    post.salary = salary;
    changes.salary = 'Salary updated';
  }
  
  if (jobType && jobType !== post.jobType) {
    oldValues.jobType = post.jobType;
    post.jobType = jobType;
    changes.jobType = `Changed from "${oldValues.jobType}" to "${jobType}"`;
  }
  
  post.editedByAdmin = true;
  await post.save();
  
  // Create audit log
  await createAuditLog(
    adminUser.id,
    adminUser.name || 'Admin',
    id,
    'Post',
    'edit_post',
    Object.values(changes).join(', '),
    { oldValues, newValues: { title, description, company, location, salary, jobType } }
  );
  
  return {
    success: true,
    message: "Post updated successfully",
    post
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
