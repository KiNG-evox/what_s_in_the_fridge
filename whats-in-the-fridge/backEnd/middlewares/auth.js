import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: "Invalid token format" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded;

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: "Token expired" });
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}

export function adminMiddleware(req, res, next) {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied. Admin only." });
        next();
    } catch (error) {
        console.error("Admin middleware error:", error);
        res.status(500).json({ success: false, message: "Authorization error" });
    }
}
