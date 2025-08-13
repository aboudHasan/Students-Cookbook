import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import errorHandler from "./middleware/error.js";
import router from "./routes/router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 5000;
const apiKey = process.env.API_KEY;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(errorHandler);
app.use("/api", router);

app.listen(port, () => console.log(`Server is running on port ${port}`));
