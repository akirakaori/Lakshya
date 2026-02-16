const jwt = require('jsonwebtoken');
const { ROLES } = require('../Library/roles');

/**
 * Middleware to authorize users based on roles
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Token missing'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = decoded;
        
        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(decoded.role)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to access this resource'
          });
        }
        
        next();
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid or expired token'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

module.exports = authorizeRoles;
