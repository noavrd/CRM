import "dotenv/config"; // כדי לקרוא .env
import express from "express";
import cors from "cors";
import { adminDb } from "./firebaseAdmin";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
