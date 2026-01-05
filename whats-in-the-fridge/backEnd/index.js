import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';

// Import routes
import { RouterRecipe } from "./routes/recipesRoute.js";
import { RouterFavorites } from "./routes/favoritesRoute.js";
import { RouterReview } from "./routes/reviewRoute.js";
import { RouterAuth } from "./routes/authRoute.js";
import { RouterAdmin } from "./routes/adminRoute.js";

// Import middleware
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

// ES6 way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(morgan("dev"));      // Log HTTP requests
app.use(express.json());     // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://*.azurewebsites.net' // Allow Azure domains
      ].filter(Boolean)
    : ['http://localhost:4200'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Serve uploaded images - MUST come before API routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes - MUST come before Angular static files
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to What's in the Fridge API",
    status: "Server is running ✅",
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use("/api/auth", RouterAuth);
app.use("/api/recipes", RouterRecipe);
app.use("/api/favorites", RouterFavorites);
app.use("/api/reviews", RouterReview);
app.use("/api/admin", RouterAdmin);

// Serve Angular static files (Production only)
if (process.env.NODE_ENV === 'production') {
  const angularDistPath = path.join(__dirname, '../frontend/dist/frontend/browser');
  
  // Serve static files from Angular build
  app.use(express.static(angularDistPath));
  
  // Handle Angular routing - send all non-API requests to index.html
  app.get('/(.*)', (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });
}

// 404 - Route not found (for API routes)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found ❌",
  });
});

// Global error handler (must come last)
app.use(errorHandler);

// Create HTTP server
const httpServer = http.createServer(app);
export { httpServer };
export default app;
