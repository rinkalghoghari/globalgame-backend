import { VercelRequest, VercelResponse } from "@vercel/node";

export const authMiddleware = (
  req: VercelRequest,
  res: VercelResponse
): boolean => {
  const key = req.headers["x-api-key"];

  if (key !== process.env.BACKEND_KEY) {
    res.status(401).json({ message: "Unauthorized" });
    return false; // ❌ stop execution
  }
  
  return true; // ✅ continue execution
};
