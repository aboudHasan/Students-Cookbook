/**
 * Express Router Configuration
 *
 * Defines API routes for the recipe application.
 * All routes are prefixed with /api when mounted in the main app.
 */

import express from "express";
import {
  getAllIngredients,
  findRecipes,
  getRecipeURL,
} from "../controllers/ingredients.js";

// Create Express router instance
const router = express.Router();

/**
 * Route Definitions
 */

// GET /api/getAllIngredients
// Returns the complete list of available ingredients from the JSON file
router.get("/getAllIngredients", getAllIngredients);

// GET /api/:id
// Returns information about the recipe, but in this case, I'm just looking for the URL
// Giving the JSON to the front-end so users can actually get the URL of the recipe
router.get("/:id", getRecipeURL);

// POST /api/findrecipes
// Searches for recipes based on provided ingredients
// Expects JSON body with ingredients array and optional number parameter
// Returns categorized recipe matches (perfect, imperfect, bad)
router.post("/findrecipes", findRecipes);

export default router;
