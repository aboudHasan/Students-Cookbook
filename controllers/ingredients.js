import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES modules compatibility - get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const apiKey = process.env.API_KEY;

// Spoonacular API endpoints
const searchURL = "https://api.spoonacular.com/recipes/findByIngredients";
const complexSearchURL = "https://api.spoonacular.com/recipes/complexSearch";

/**
 * Common pantry items that are typically available in most kitchens.
 * These ingredients are automatically included in recipe searches to improve matching.
 */
const pantryItems = [
  "water",
  "ice",
  "flour",
  "sugar",
  "cane sugar",
  "olive oil",
  "cooking fat",
  "cooking oil",
  "vegetable oil",
  "black pepper",
  "sea salt",
  "salt",
  "baking soda",
  "baking powder",
];

/**
 * Reads and parses ingredients from a JSON file
 *
 * @param {string} filePath - Relative path to the ingredients JSON file
 * @returns {Array<string>} Array of ingredient strings
 * @throws {Error} If file cannot be read or parsed
 */
const getIngredientsFromFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    const fileContent = fs.readFileSync(fullPath, "utf8");
    const data = JSON.parse(fileContent);
    console.log("Successfully read ingredients from file");

    // Handle both direct arrays and objects with ingredients property
    return Array.isArray(data) ? data : data.ingredients || [];
  } catch (error) {
    throw new Error(`Error reading ingredients file: ${error.message}`);
  }
};

/**
 * Searches for recipes using the Spoonacular findByIngredients API endpoint
 *
 * @param {Array<string>} ingredientsArray - Array of ingredient names to search with
 * @param {Object} options - Search configuration options
 * @param {number} [options.number=10] - Maximum number of recipes to return
 * @returns {Object} Categorized recipe results with perfect, imperfect, and bad matches
 * @throws {Error} If API request fails or returns error status
 */
async function searchByIngredients(ingredientsArray, options = {}) {
  try {
    const { number = 10 } = options;

    // Combine user ingredients with common pantry items for better matching
    const combinedIngredients = ingredientsArray.concat(pantryItems);
    const ingredients = combinedIngredients.join(",");
    const testIngredients = ingredientsArray.join(",");

    // Note: Currently using testIngredients (user ingredients only) in the actual request
    // console.log(ingredients); // Debug log for combined ingredients

    // Make API request to Spoonacular
    const res = await fetch(
      `${searchURL}?ingredients=${encodeURIComponent(
        testIngredients
      )}&number=50&ranking=2&ignorePantry=false&apiKey=${apiKey}`
    );

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const recipes = await res.json();

    // Categorize recipes based on missing ingredient count
    const perfectMatches = recipes.filter(
      (item) => item.missedIngredientCount === 0
    );

    const imperfectMatches = recipes.filter(
      (item) => item.missedIngredientCount === 1
    );

    const badMatches = recipes.filter(
      (item) => item.missedIngredientCount >= 2
    );

    // Count recipes in each category
    const perfectMatchesCount = perfectMatches.length;
    const imperfectMatchesCount = imperfectMatches.length;
    const badMatchesCount = badMatches.length;

    // Return structured response with categorized results
    const allRecipes = {
      perfectMatchesCount,
      perfectMatches,
      imperfectMatchesCount,
      imperfectMatches,
      badMatchesCount,
      badMatches,
    };

    return allRecipes;
  } catch (error) {
    console.log(`Failed to search by ingredients: ${error.message}`);
    throw error;
  }
}

/**
 * Express route handler - Returns all available ingredients from the JSON file
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllIngredients = (req, res) => {
  const ingredients = getIngredientsFromFile("../ingredients.json");
  res.status(200).json(ingredients);
};

/**
 * Express route handler - Finds recipes based on provided ingredients
 *
 * Validates ingredients against a master list and searches for matching recipes
 * using the Spoonacular API. Returns categorized results based on recipe completeness.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Array<string>} req.body.ingredients - Array of ingredient names to search with
 * @param {number} [req.body.number] - Number of recipes to return
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {Object} JSON response with categorized recipe matches
 *
 * Request body example:
 * {
 *   "ingredients": ["tomato", "onion", "garlic"],
 *   "number": 10
 * }
 *
 * Response format:
 * {
 *   "perfectMatchesCount": 5,
 *   "perfectMatches": [...],
 *   "imperfectMatchesCount": 3,
 *   "imperfectMatches": [...],
 *   "badMatchesCount": 2,
 *   "badMatches": [...]
 * }
 */
export const findRecipes = async (req, res, next) => {
  try {
    // Validate request body structure and content
    if (
      req.body.ingredients.length === 0 ||
      !Array.isArray(req.body.ingredients)
    ) {
      const error = new Error("Missing body parameters");
      error.status = 400;
      return next(error);
    }

    const ingredients = req.body.ingredients;

    // Normalize all ingredients to lowercase for consistent comparison
    for (let i = 0; i < ingredients.length; i++) {
      ingredients[i] = ingredients[i].toLowerCase();
    }

    // Get optional number of recipes parameter, default to 5
    const numberOfRecipes = req.body.number || 5;

    // Load master list of valid ingredients from file
    const listOfIngredients = getIngredientsFromFile("../ingredients.json");

    // Validate that all provided ingredients exist in the master list
    const ingredientCheck = ingredients.filter(
      (item) => !listOfIngredients.includes(item)
    );

    // Return error if any invalid ingredients were found
    if (ingredientCheck.length > 0) {
      const error = new Error(
        `Problems with these ingredients: ${ingredientCheck}`
      );
      error.status = 400;
      return next(error);
    }

    // Search for recipes using validated ingredients
    const recipes = await searchByIngredients(ingredients, {
      number: numberOfRecipes,
    });

    // Return successful response with categorized recipe results
    res.status(200).json(recipes);
  } catch (error) {
    // Pass any errors to Express error handling middleware
    next(error);
  }
};
export const getRecipeURL = async (req, res, next) => {
  try {
    const recipeID = req.params.id;

    const recipeURL = await fetch(
      `https://api.spoonacular.com/recipes/${recipeID}/information?apiKey=${apiKey}`
    );

    if (!recipeURL.ok) {
      throw new Error(`API Error: ${recipeURL.status}`);
    }

    const recipeInfo = await recipeURL.json();

    res.status(200).json(recipeInfo);
  } catch (error) {
    next(error);
  }
};
