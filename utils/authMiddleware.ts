import { VercelRequest, VercelResponse } from "@vercel/node";
import { authMiddleware } from "../middleware/authMiddleware";

export const withAuth =
  (handler: Function) => async (req: VercelRequest, res: VercelResponse) => {
    if (!authMiddleware(req, res)) return;
    return handler(req, res);
  };


export const corsMiddleware = (res: VercelResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key"
  );
};

export const setCacheHeaders = (res: VercelResponse, maxAge: number) => {
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  );
};

export const getClientIp = (req: VercelRequest): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};