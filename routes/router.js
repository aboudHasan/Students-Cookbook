/**
 * Express Router Configuration
 *
 * Defines API routes for the recipe application.
 * All routes are prefixed with /api when mounted in the main app.
 */

import express from "express";
import { getAllIngredients, findRecipes } from "../controllers/ingredients.js";

// Create Express router instance
const router = express.Router();

/**
 * Route Definitions
 */

// GET /api/getAllIngredients
// Returns the complete list of available ingredients from the JSON file
// Used by clients to populate ingredient selection interfaces
router.get("/getAllIngredients", getAllIngredients);

// POST /api/findrecipes
// Searches for recipes based on provided ingredients
// Expects JSON body with ingredients array and optional number parameter
// Returns categorized recipe matches (perfect, imperfect, bad)
router.post("/findrecipes", findRecipes);

export default router;
