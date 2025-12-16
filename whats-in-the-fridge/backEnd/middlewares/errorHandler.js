// Global error handling middleware
export function errorHandler(err, req, res, next) {
  console.error("🔥 Error caught by middleware:", err);

  // Validation errors (Mongoose)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // Cast errors (invalid Mongo ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // Duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: `${Object.keys(err.keyPattern)[0]} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Fallback for unexpected errors
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error 💥",
  });
}
