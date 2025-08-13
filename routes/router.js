import express from "express";
import { getAllIngredients, findRecipes } from "../controllers/ingredients.js";

const router = express.Router();

router.get("/getAllIngredients", getAllIngredients);
router.post("/findrecipes", findRecipes);

export default router;
