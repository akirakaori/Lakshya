const jwt = require("jsonwebtoken");
const ROLES = require("../Library/roles").ROLES;
const UserModel = require("../models/user-model");

const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Token missing",
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const dbUser = await UserModel.findById(decoded.id).select("_id role name email isActive isDeleted");

      if (!dbUser || dbUser.isDeleted || dbUser.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Account is deactivated",
        });
      }

      // attach user info to request
      req.user = {
        id: dbUser._id.toString(),
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
      };

      if (!allowedRoles.includes(dbUser.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }
  };
};

module.exports = authorizeRoles;
