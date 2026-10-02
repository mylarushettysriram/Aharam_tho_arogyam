const { error } = require("../utils/response");

// 404 handler for unknown routes
function notFound(req, res, next) {
  error(res, 404, `Route not found: ${req.originalUrl}`);
}

// Centralized error handler - every controller forwards errors here via next(err)
function errorHandler(err, req, res, next) {
  console.error("ERROR:", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    const message = err.errors.map((e) => e.message).join(", ");
    return error(res, 400, message);
  }

  // Multer file size errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return error(res, 400, "Image file is too large (max 5MB)");
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  return error(res, statusCode, message);
}

module.exports = { notFound, errorHandler };
