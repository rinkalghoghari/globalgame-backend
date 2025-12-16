import { VercelRequest, VercelResponse } from "@vercel/node";


type Handler = (
  req: VercelRequest,
  res: VercelResponse
) => Promise<void | VercelResponse>;

export const authMiddleware = (handler: Handler) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const key = req.headers["x-api-key"];

    if (req.method === "OPTIONS") {
      return handler(req, res);
    }
    if (!key || key !== process.env.BACKEND_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    return handler(req, res);
  };
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
