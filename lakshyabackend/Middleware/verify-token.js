const jwt = require('jsonwebtoken');
const UserModel = require('../models/user-model');

/**
 * Middleware to verify JWT token
 */
const verifyToken = async (req, res, next) => {
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
      const dbUser = await UserModel.findById(decoded.id).select('_id role name email isActive isDeleted');

      if (!dbUser || dbUser.isDeleted || dbUser.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Account is deactivated',
        });
      }

      // Attach user info to request
      req.user = {
        id: dbUser._id.toString(),
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
      };
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

module.exports = verifyToken;
