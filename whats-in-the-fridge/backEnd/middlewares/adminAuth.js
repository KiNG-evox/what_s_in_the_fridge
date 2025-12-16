// middlewares/adminAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const adminAuthMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        // Attach user to request
        req.user = { id: user._id, role: user.role };
        next();

    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};