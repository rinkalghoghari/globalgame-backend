import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../../utils/db";
import { authMiddleware, corsMiddleware, setCacheHeaders } from "../../utils/middleware";
import Comment from "../../models/comment.model";
import { CACHE_TTL, CacheService } from "../../utils/cache";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  corsMiddleware(res);

  if (req.method === "OPTIONS") {
     res.status(200).end();
     return
  }

  try {
    await connectDB();

    if (req.method === "GET") {
      const { gameId } = req.query;

      if (!gameId || typeof gameId !== "string") {
        res.status(400).json({
          success: false,
          message: "Game ID is required"
        });
        return;
      }

      const cacheKey = `comments_${gameId}`;

     const cachedComments = CacheService.get<any[]>(cacheKey);
      if (cachedComments) {
        console.log("✅ Returning comments from cache");
        setCacheHeaders(res, 120);
         res.status(200).json({
          success: true,
          data: cachedComments,
          total: cachedComments.length,
          cached: true,
          source: "memory-cache",
        });
        return;
      }

      const comments = await Comment.find({ gameId })
        .sort({ createdAt: -1 })
        .limit(100);

      const formattedComments = comments.map(comment => ({
        id: comment._id,
        gameId: comment.gameId,
        name: comment.name,
        comment: comment.comment,
        createdAt: comment.createdAt,
      }));

      CacheService.set(cacheKey, formattedComments, CACHE_TTL.COMMENTS);
      setCacheHeaders(res, 120); 

       res.status(200).json({
        success: true,
        data: formattedComments,
        total: formattedComments.length,
        cached: false,
        source: "database",
      });
      return;
    }

    if (req.method === "POST") {
      const { gameId, name, comment } = req.body;

      if (!gameId || !name || !comment) {
         res.status(400).json({
          success: false,
          message: "All fields are required"
        });
        return;
      }

      if (name.trim().length < 2) {
         res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters"
        });
        return;
      }

      // if (comment.trim().length < 5) {
      //    res.status(400).json({
      //     success: false,
      //     message: "Comment must be at least 5 characters"
      //   });
      //   return;
      // }

      const newComment = await Comment.create({
        gameId,
        name: name.trim(),
        comment: comment.trim()
      });

      CacheService.delete(`comments_${gameId}`);

       res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: {
          id: newComment._id,
          gameId: newComment.gameId,
          name: newComment.name,
          comment: newComment.comment,
          createdAt: newComment.createdAt,
        }
      });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
         res.status(400).json({
          success: false,
          message: "Comment ID is required"
        });
        return;
      }

      const comment = await Comment.findById(id);

      if (!comment) {
         res.status(404).json({
          success: false,
          message: "Comment not found"
        });
        return;
      }

      await Comment.findByIdAndDelete(id);

      // Invalidate cache
      CacheService.delete(`comments_${comment.gameId}`);

       res.status(200).json({
        success: true,
        message: "Comment deleted successfully"
      });
      return;
    }

    res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
    return;

  } catch (error: any) {
    console.error("❌ API Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
    return;
  }
};

export default authMiddleware(handler);