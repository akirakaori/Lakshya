const router = require("express").Router();
const authenticate = require("../Middleware/auth-middleware");
const authorizeRoles = require("../Middleware/role-middleware");
const ROLES = require("../Library/roles").ROLES;
const { getAllUsers, getAllPosts, deletePost, editUser, deleteUser, editPost } = require("../Controller/admin-controller");
const adminJobController = require("../Controller/admin-job-controller");

// Get all users
router.get(
  "/users",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  getAllUsers
);

// Edit user
router.patch(
  "/users/:id",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  editUser
);

// Delete user (soft delete)
router.delete(
  "/users/:id",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  deleteUser
);

// Get all posts
router.get(
  "/posts",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  getAllPosts
);

// Edit post
router.patch(
  "/posts/:id",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  editPost
);

// Delete a post (soft delete)
router.delete(
  "/posts/:id",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  deletePost
);

// Get all jobs (admin view)
router.get(
  "/jobs",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  adminJobController.getAllJobs
);

// Admin soft delete job
router.patch(
  "/jobs/:id/soft-delete",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  adminJobController.adminSoftDeleteJob
);

// Admin edit job
router.patch(
  "/jobs/:id",
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  adminJobController.adminEditJob
);

module.exports = router;
