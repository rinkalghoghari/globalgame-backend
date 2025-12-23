import type { VercelRequest, VercelResponse } from "@vercel/node";
import Rating from "../../../models/rating.model";
import { connectDB } from "../../../utils/db";
import { corsMiddleware, authMiddleware } from "../../../utils/middleware";

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

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === "GET") {
      const { gameId } = req.query;
      const visitorId = req.cookies.visitor_id;

      if (!gameId || typeof gameId !== "string") {
        return res.status(400).json({ success: false });
      }

      const ip = getClientIp(req);

      res.setHeader("Cache-Control", "no-store");

      if (!visitorId) {
        return res.json({
          success: true,
          data: {
            hasRated: false,
            rating: 0,
          },
        });
      }

      const rating = await Rating.findOne({ gameId ,visitorId }).lean();

      return res.json({
        success: true,
        data: {
          hasRated: !!rating,
          rating: rating?.rating || 0,
        },
      });
    }

    return res.status(405).json({ success: false });
  } catch (error) {
    console.error("checkUserRating error:", error);
    return res.status(500).json({ success: false });
  }
};

export default authMiddleware(handler);
