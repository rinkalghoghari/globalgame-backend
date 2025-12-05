import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import ratingRoutes from "./routes/rating.routes";
import commentRoutes from "./routes/comment.routes";
import gameRoutes from "./routes/game.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/ratings", ratingRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/games", gameRoutes);


app.get("/", (req, res) => { res.send("GlobalGames API Running...") });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
