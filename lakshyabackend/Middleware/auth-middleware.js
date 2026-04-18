const jwt = require('jsonwebtoken');
const UserModel = require('../models/user-model');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('⚠️ Auth failed: Token missing', {
                path: req.path,
                method: req.method,
                hasAuthHeader: !!authHeader
            });
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Token missing'
            });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const dbUser = await UserModel.findById(decoded.id).select('_id role name email isActive isDeleted');
        if (!dbUser || dbUser.isDeleted || dbUser.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Account is deactivated'
            });
        }
        
        // Attach user info to request
        req.user = {
            id: dbUser._id.toString(),
            role: dbUser.role,
            name: dbUser.name,
            email: dbUser.email,
        };
        console.log('✅ Auth successful:', { userId: dbUser._id.toString(), role: dbUser.role, path: req.path });
        next();
    } catch (error) {
        console.warn('⚠️ Auth failed: Invalid token', {
            path: req.path,
            method: req.method,
            error: error.message
        });
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid token'
        });
    }
};

module.exports = authenticate;