import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();
app.use(cors());
app.use(express.json());

registerRoutes(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
