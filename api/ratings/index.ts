import type { VercelRequest, VercelResponse } from "@vercel/node";
import Rating from "../../models/rating.model";
import { connectDB } from "../../utils/db";
import { corsMiddleware, authMiddleware, setCacheHeaders } from "../../utils/middleware";
import { CACHE_TTL } from "../../utils/cacheTtl";


export const getClientIp = (req: VercelRequest): string => {
  const forwarded =
    (req.headers["x-vercel-forwarded-for"] as string) ||
    (req.headers["x-forwarded-for"] as string);

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const localIp = req.socket?.remoteAddress;
  if (localIp === "::1") return "127.0.0.1";

  return localIp || "unknown";
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  corsMiddleware(res);
  await connectDB();

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      const { gameId, rating, name } = req.body;
      const ip = getClientIp(req);
    
      if (!gameId || !rating || !name) {
        return res.status(400).json({
          success: false,
          message: "Game ID, rating and name are required",
          ip,
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }

      const alreadyRated = await Rating.findOne({ gameId, ip });
      if (alreadyRated) {
        return res.status(400).json({
          success: true,
          message: "You have already rated this game",
        });
      }

      const newRating = await Rating.create({
        gameId: gameId.trim(),
        rating,
        name: name.trim(),
        ip,
      });

      const stats = await calculateRatingStats(gameId);

      return res.status(201).json({
        success: true,
        message: "Rating added successfully",
        data: {
          rating: newRating.rating,
          name: newRating.name,
          ...stats,
        },
      });
    }


    if (req.method === "GET") {
      const { gameId } = req.query;

      if (!gameId || typeof gameId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Game ID is required",
        });
      }

      setCacheHeaders(res, CACHE_TTL.RATINGS_STATS);

      const stats = await calculateRatingStats(gameId);

      return res.status(200).json({
        success: true,
        data: stats,
        cached: true,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error: any) {
    console.error("Rating API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default authMiddleware(handler);


async function calculateRatingStats(gameId: string) {
  const ratings = await Rating.find({ gameId });

  if (ratings.length === 0) {
    return {
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = ratings.reduce((t: number, r: any) => t + r.rating, 0);
  const average = Number((sum / ratings.length).toFixed(1));

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r: any) => {
    distribution[r.rating as keyof typeof distribution]++;
  });

  return {
    total: ratings.length,
    average,
    distribution,
  };
}
