import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiKey = process.env.API_KEY;
const searchURL = "https://api.spoonacular.com/recipes/findByIngredients";

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
    const { number = 10, ranking = 1, ignorePantry = false } = options;
    const ingredients = ingredientsArray.join(",");

    const res = await fetch(
      `${searchURL}?ingredients=${encodeURIComponent(
        ingredients
      )}&number=${number}&ranking=${ranking}&ignorePantry=${ignorePantry}&apiKey=${apiKey}`
    );

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const recipes = await res.json();
    return recipes;
  } catch (error) {
    console.log(`Failed to search by ingredients: ${error.message}`);
  }
}

export const getAllIngredients = (req, res) => {
  const ingredients = getIngredientsFromFile("../ingredients.json");
  res.status(200).json(ingredients);
};

export const findRecipes = (req, res) => {};
