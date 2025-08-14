import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiKey = process.env.API_KEY;
const searchURL = "https://api.spoonacular.com/recipes/findByIngredients";
const complexSearchURL = "https://api.spoonacular.com/recipes/complexSearch";
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
];

const getIngredientsFromFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    const fileContent = fs.readFileSync(fullPath, "utf8");
    const data = JSON.parse(fileContent);

    console.log("Successfully read ingredients from file");
    return Array.isArray(data) ? data : data.ingredients || [];
  } catch (error) {
    throw new Error(`Error reading ingredients file: ${error.message}`);
  }
};

async function searchByIngredients(ingredientsArray, options = {}) {
  try {
    const { number = 10 } = options;
    const combinedIngredients = ingredientsArray.concat(pantryItems);
    const ingredients = combinedIngredients.join(",");

    const res = await fetch(
      `${complexSearchURL}?includeIngredients=${encodeURIComponent(
        ingredients
      )}&number=${number}&sort=min-missing-ingredients&fillIngredients=true&apiKey=${apiKey}`
    );

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const recipes = await res.json();
    return recipes;
  } catch (error) {
    console.log(`Failed to search by ingredients: ${error.message}`);
    throw error;
  }
}

export const getAllIngredients = (req, res) => {
  const ingredients = getIngredientsFromFile("../ingredients.json");
  res.status(200).json(ingredients);
};

export const findRecipes = async (req, res, next) => {
  try {
    if (
      req.body.ingredients.length === 0 ||
      !Array.isArray(req.body.ingredients)
    ) {
      const error = new Error("Missing body parameters");
      error.status = 400;
      return next(error);
    }

    const ingredients = req.body.ingredients;
    for (let i = 0; i < ingredients.length; i++) {
      ingredients[i] = ingredients[i].toLowerCase();
    }
    const numberOfRecipes = req.body.number || 5;
    const listOfIngredients = getIngredientsFromFile("../ingredients.json");
    const ingredientCheck = ingredients.filter(
      (item) => !listOfIngredients.includes(item)
    );

    if (ingredientCheck.length > 0) {
      const error = new Error(
        `Problems with these ingredients: ${ingredientCheck}`
      );
      error.status = 400;
      return next(error);
    }

    const recipes = await searchByIngredients(ingredients, {
      number: numberOfRecipes,
    });
    res.status(200).json(recipes);
  } catch (error) {
    next(error);
  }
};
