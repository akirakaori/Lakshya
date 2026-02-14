const adminService = require("../Services/admin-service");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { search, role, isActive } = req.query;
    
    const result = await adminService.getAllUsersService({
      search,
      role,
      isActive,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error fetching users",
      error: error.message,
    });
  }
};

// Get all posts
const getAllPosts = async (req, res) => {
  try {
    const { search, status, isActive, jobType, company, location } = req.query;
    
    const result = await adminService.getAllPostsService({
      search,
      status,
      isActive,
      jobType,
      company,
      location,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error fetching posts",
      error: error.message,
    });
  }
};

// Delete a post (soft delete)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await adminService.deletePostService({
      adminUser: {
        id: req.user.id,
        name: req.user.name,
      },
      id,
      reason,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error deleting post",
      error: error.message,
    });
  }
};

// Edit user
const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, password } = req.body;
    
    const result = await adminService.editUserService({
      adminUser: {
        id: req.user.id,
        name: req.user.name,
      },
      id,
      role,
      isActive,
      password,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error editing user:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error editing user",
      error: error.message,
    });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await adminService.deleteUserService({
      adminUser: {
        id: req.user.id,
        name: req.user.name,
      },
      id,
      reason,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error deleting user",
      error: error.message,
    });
  }
};

// Edit post
const editPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, company, location, salary, jobType } = req.body;
    
    const result = await adminService.editPostService({
      adminUser: {
        id: req.user.id,
        name: req.user.name,
      },
      id,
      title,
      description,
      company,
      location,
      salary,
      jobType,
    });
    
    res.json(result);
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error editing post",
      error: error.message,
    });
  }
};

module.exports = { getAllUsers, getAllPosts, deletePost, editUser, deleteUser, editPost };
