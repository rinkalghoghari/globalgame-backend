import * as express from "express";
import { addGame, getGames, deleteGamesById } from "../controllers/game.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/add",authMiddleware, addGame);
router.get("/",authMiddleware, getGames);
router.delete("/:id",authMiddleware, deleteGamesById);

export default router;
