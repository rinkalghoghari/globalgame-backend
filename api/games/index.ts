// api/games/index.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { getGames } from "../../controllers/game.controller";
import { authMiddleware } from "../../middleware/authMiddleware";
import { connectDB } from "../../utils/db";
import { corsMiddleware } from "../../utils/authMiddleware";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  await connectDB();
  corsMiddleware(res)

  if (req.method === "GET") {
    if (!authMiddleware(req, res)) return;
    return getGames(req, res);
  }

  res.status(405).json({ message: "Method Not Allowed" });
}
