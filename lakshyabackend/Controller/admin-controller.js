const UserModel = require("../models/user");
const PostModel = require("../models/post");
const AuditLogModel = require("../models/audit-log");
const bcrypt = require('bcrypt');

// Helper function to create audit log
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

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await PostModel.find()
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
    
    res.json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

// Delete a post (soft delete)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const post = await PostModel.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    
    // Soft delete
    post.isActive = false;
    post.status = 'deleted';
    await post.save();
    
    // Create audit log
    await createAuditLog(
      req.user.id,
      req.user.name || 'Admin',
      id,
      'Post',
      'delete_post',
      reason || 'Post deleted by admin',
      { postTitle: post.title, company: post.company }
    );
    
    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message,
    });
  }
};

// Edit user
const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, password } = req.body;
    
    const user = await UserModel.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
      req.user.id,
      req.user.name || 'Admin',
      id,
      'User',
      actionType,
      Object.values(changes).join(', '),
      { oldValues, newValues: { role, isActive } }
    );
    
    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Error editing user:", error);
    res.status(500).json({
      success: false,
      message: "Error editing user",
      error: error.message,
    });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await UserModel.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    // Prevent deleting admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }
    
    // Soft delete
    user.isActive = false;
    await user.save();
    
    // Create audit log
    await createAuditLog(
      req.user.id,
      req.user.name || 'Admin',
      id,
      'User',
      'delete_user',
      reason || 'User deleted by admin',
      { userName: user.name, email: user.email, role: user.role }
    );
    
    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// Edit post
const editPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, company, location, salary, jobType } = req.body;
    
    const post = await PostModel.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
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
      req.user.id,
      req.user.name || 'Admin',
      id,
      'Post',
      'edit_post',
      Object.values(changes).join(', '),
      { oldValues, newValues: { title, description, company, location, salary, jobType } }
    );
    
    res.json({
      success: true,
      message: "Post updated successfully",
      post
    });
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).json({
      success: false,
      message: "Error editing post",
      error: error.message,
    });
  }
};

module.exports = { getAllUsers, getAllPosts, deletePost, editUser, deleteUser, editPost };
