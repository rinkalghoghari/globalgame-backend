import { VercelRequest, VercelResponse } from "@vercel/node";

export const ensureVisitorId = async (req: VercelRequest, res: VercelResponse) => {
  if (!req.cookies?.visitor_id) {
    const { v4: uuidv4 } = await import('uuid');
    const visitorId = uuidv4();

    res.setHeader(
      "Set-Cookie",
      `visitor_id=${visitorId}; Path=/; HttpOnly; SameSite=Lax`
    );

    // Make it available in same request
    req.cookies.visitor_id = visitorId;
  }
};
