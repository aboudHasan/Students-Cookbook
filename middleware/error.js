/**
 * Express Error Handler Middleware
 *
 * Centralized error handling middleware that catches and processes all errors
 * thrown by route handlers or other middleware in the application.
 * Must be defined after all routes and middleware to catch their errors.
 *
 * @param {Error} err - Error object thrown by previous middleware or route handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (unused in final error handler)
 */
const errorHandler = (err, req, res, next) => {
  // Check if error has a custom status code (client errors like 400, 404, etc.)
  if (err.status) {
    // Use the custom status code provided by the error
    res.status(err.status).json({ message: `Error: ${err.message}` });
  } else {
    // Default to 500 Internal Server Error for unhandled errors
    res.status(500).json({ message: `Error: ${err.message}` });
  }
};

export default errorHandler;
