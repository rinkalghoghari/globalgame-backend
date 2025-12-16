import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../utils/db";
import {
  authMiddleware,
  corsMiddleware,
  setCacheHeaders,
} from "../utils/middleware";
import { CacheService, CACHE_TTL } from "../utils/cache";
import Game from "../models/game.model";
import Comment from "../models/comment.model";
import Rating from "../models/rating.model";
import { games } from "../seed/games";

const GAMES_CACHE_KEY = "all_games";

async function gamesHandler(req: VercelRequest, res: VercelResponse) {
  corsMiddleware(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();
    if (req.method === "GET") {
      const cachedGames = CacheService.get<any[]>(GAMES_CACHE_KEY);

      if (cachedGames) {
        setCacheHeaders(res, 86400);
        return res.status(200).json({
          success: true,
          data: cachedGames,
          cached: true,
          total: cachedGames.length,
        });
      }

      const gamesData = await Game.find().sort({ createdAt: -1 });

      CacheService.set(GAMES_CACHE_KEY, gamesData, CACHE_TTL.GAMES_LIST);
      setCacheHeaders(res, 86400);

      return res.status(200).json({
        success: true,
        data: gamesData,
        cached: false,
        total: gamesData.length,
      });
    }
    if (req.method === "POST") {
      const newGame = await Game.create(req.body || games);

      CacheService.delete(GAMES_CACHE_KEY);

      return res.status(201).json({
        success: true,
        message: "Game added successfully",
        data: newGame,
      });
    }
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "Game ID is required",
        });
      }

      const deletedGame = await Game.findByIdAndDelete(id);

      if (!deletedGame) {
        return res.status(404).json({
          success: false,
          message: "Game not found",
        });
      }

      await Comment.deleteMany({ gameId: id });
      await Rating.deleteMany({ gameId: id });

      CacheService.delete(GAMES_CACHE_KEY);
      CacheService.deletePattern(`game_${id}`);
      CacheService.deletePattern(`comments_${id}`);
      CacheService.deletePattern(`ratings_${id}`);

      return res.status(200).json({
        success: true,
        message: "Game and all related data deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error: any) {
    console.error("❌ API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export default authMiddleware(gamesHandler);
