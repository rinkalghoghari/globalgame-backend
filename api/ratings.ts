import type { VercelRequest, VercelResponse } from "@vercel/node";
import Rating from "../models/rating.model";
import { connectDB } from "../utils/db";
import { corsMiddleware, authMiddleware } from "../utils/middleware";
import { CacheService } from "../utils/cache";

export const getNormalizedIp = (req: VercelRequest): string => {
  const forwarded = req.headers["x-forwarded-for"];
  let ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.headers["x-real-ip"]?.toString() ||
      req.socket?.remoteAddress ||
      "unknown";

  // remove IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  corsMiddleware(res);
  await connectDB();

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      const { gameId, rating, name } = req.body;
      const ip = getNormalizedIp(req);

      if (!gameId || !rating || !name) {
        return res.status(400).json({ success: false, message: "Missing fields" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Invalid rating" });
      }

      const alreadyRated = await Rating.findOne({ gameId, ip });
      if (alreadyRated) {
        return res.status(400).json({
          success: false,
          message: "You have already rated this game",
        });
      }

      const newRating = await Rating.create({
        gameId: gameId.trim(),
        rating,
        name: name.trim(),
        ip,
      });
      CacheService.deletePattern(`rating_check_${gameId}`);
      CacheService.deletePattern(`ratings_${gameId}`);

      return res.status(201).json({
        success: true,
        message: "Rating added successfully",
        data: {
          rating: newRating.rating,
          name: newRating.name,
        },
      });
    }

    if (req.method === "GET") {
      const { gameId, action } = req.query;
      const ip = getNormalizedIp(req);

      if (!gameId || typeof gameId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Game ID is required",
        });
      }

      if (action === "check") {
        const cacheKey = `rating_check_${gameId}_${ip}`;

        const cached = CacheService.get<any>(cacheKey);
        if (cached) {
          return res.json({
            success: true,
            cached: true,
            data: cached,
          });
        }

        const userRating = await Rating.findOne({ gameId, ip });

        const responseData = {
          hasRated: !!userRating,
          rating: userRating?.rating || 0,
        };

        // ✅ CACHE IT
        CacheService.set(
          cacheKey,
          responseData,
          5 * 60 * 1000 // 5 minutes
        );

        return res.json({
          success: true,
          cached: false,
          data: responseData,
        });
      }
      const stats = await calculateRatingStats(gameId);

      return res.json({
        success: true,
        data: stats,
        ip
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
  const average = parseFloat((sum / ratings.length).toFixed(1));

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
