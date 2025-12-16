import dotenv from 'dotenv';
import { DbConnect } from './models/DbConnect.js';
import { httpServer } from './index.js';

dotenv.config();

// Connect to MongoDB
DbConnect();

// Use PORT from .env or fallback to 3000
const PORT = process.env.PORT || 3000;

// Start the server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API Documentation available at http://localhost:${PORT}/`);
});
