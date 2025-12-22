import { VercelRequest, VercelResponse } from "@vercel/node";
import { v4 as uuidv4 } from "uuid";

export const ensureVisitorId = (req: VercelRequest, res: VercelResponse) => {
  if (!req.cookies?.visitor_id) {
    const visitorId = uuidv4();

    res.setHeader(
      "Set-Cookie",
      `visitor_id=${visitorId}; Path=/; HttpOnly; SameSite=Lax`
    );

    // Make it available in same request
    req.cookies.visitor_id = visitorId;
  }
};
