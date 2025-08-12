import express from "express";
import { getAllIngredients } from "../controllers/ingredients";

const router = express.Router();

router.get("/getAllIngredients", getAllIngredients);

export default router;
