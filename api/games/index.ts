import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../../utils/db";
import {
  authMiddleware,
  corsMiddleware,
  setCacheHeaders,
} from "../../utils/middleware";
import Game from "../../models/game.model";
import Comment from "../../models/comment.model";
import Rating from "../../models/rating.model";
import { games } from "../../seed/games";
import { CACHE_TTL } from "../../utils/cacheTtl";
import { ensureVisitorId } from "../../utils/setVisiterid";

async function gamesHandler(req: VercelRequest, res: VercelResponse) {
  corsMiddleware(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === "GET") {
      if (!req.cookies.visitor_id) {
        ensureVisitorId(req, res);
      }

      setCacheHeaders(res, CACHE_TTL.GAMES_LIST);
      const gamesData = await Game.find().sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        data: gamesData,
        cached: true,
        total: gamesData.length,
      });
    }

    if (req.method === "POST") {
      const newGame = await Game.create(req.body || games);

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
