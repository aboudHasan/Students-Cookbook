/**
 * Express.js Recipe API Server
 *
 * Main application entry point that configures and starts the Express server
 * for the recipe search API using the Spoonacular API service.
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import errorHandler from "./middleware/error.js";
import router from "./routes/router.js";

// ES modules compatibility - resolve current directory path
// Required because __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configuration
const port = process.env.PORT || 5000; // Use environment PORT or default to 5000
const apiKey = process.env.API_KEY; // Spoonacular API key from environment variables

// Initialize Express application
const app = express();

/**
 * Middleware Configuration
 * Applied in order - each request passes through these middlewares
 */

// Parse incoming JSON requests (Content-Type: application/json)
// Enables req.body to contain parsed JSON data
app.use(express.json());

// Parse URL-encoded form data (Content-Type: application/x-www-form-urlencoded)
// extended: false uses querystring library for parsing (simpler, faster)
// extended: true would use qs library (supports nested objects)
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
// Files in /public can be accessed directly via HTTP (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

/**
 * Route Configuration
 */

// Mount API routes at /api endpoint
// All routes defined in router.js will be prefixed with /api
// Example: GET /api/ingredients, POST /api/recipes, etc.
app.use("/api", router);

/**
 * Error Handling Middleware
 *
 * Must be defined AFTER all routes and other middleware
 * Catches any errors thrown by route handlers or previous middleware
 * Provides centralized error handling and consistent error responses
 */
app.use(errorHandler);

/**
 * Start Server
 *
 * Begins listening for HTTP requests on the specified port
 * Server will handle incoming requests according to the configured routes and middleware
 */
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
