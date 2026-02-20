const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
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
        
        // Attach user info to request
        req.user = decoded;
        console.log('✅ Auth successful:', { userId: decoded.id, role: decoded.role, path: req.path });
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