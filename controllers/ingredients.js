import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export const getAllIngredients = (req, res) => {
  getIngredientsFromFile("../ingredients.json");
  res.status(200);
};
