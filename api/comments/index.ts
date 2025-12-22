import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../../utils/db";
import {
  authMiddleware,
  corsMiddleware,
  setCacheHeaders,
} from "../../utils/middleware";
import Comment from "../../models/comment.model";
import { CACHE_TTL } from "../../utils/cacheTtl";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  corsMiddleware(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === "GET") {
      const { gameId } = req.query;

      if (!gameId || typeof gameId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Game ID is required",
        });
      }

      setCacheHeaders(res, CACHE_TTL.COMMENTS);

      const comments = await Comment.find({ gameId })
        .sort({ createdAt: -1 })
        .limit(50);

      const formattedComments = comments.map(comment => ({
        id: comment._id,
        gameId: comment.gameId,
        name: comment.name,
        comment: comment.comment,
        createdAt: comment.createdAt,
      }));

      return res.status(200).json({
        success: true,
        data: formattedComments,
        total: formattedComments.length,
        cached: true,
      });
    }

    // ❌ POST (never cached)
    if (req.method === "POST") {
      const { gameId, name, comment } = req.body;

      if (!gameId || !name || !comment) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const newComment = await Comment.create({
        gameId,
        name: name.trim(),
        comment: comment.trim(),
      });

      // IMPORTANT: Disable cache for mutation responses
      res.setHeader("Cache-Control", "no-store");

      return res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: {
          id: newComment._id,
          gameId: newComment.gameId,
          name: newComment.name,
          comment: newComment.comment,
          createdAt: newComment.createdAt,
        },
      });
    }

    // ❌ DELETE (never cached)
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "Comment ID is required",
        });
      }

      const deleted = await Comment.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Disable cache
      res.setHeader("Cache-Control", "no-store");

      return res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
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
};

export default authMiddleware(handler);
