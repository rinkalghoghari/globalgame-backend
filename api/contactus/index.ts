import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../../utils/db";
import {
  authMiddleware,
  corsMiddleware,
} from "../../utils/middleware";
import Contact from "../../models/contact.model";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  corsMiddleware(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === "POST") {
      const { name, email, message } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required",
        });
      }

      const contact = await Contact.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message?.trim() || "",
      });

      res.setHeader("Cache-Control", "no-store");

      return res.status(201).json({
        success: true,
        message: "Contact request submitted",
        data: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
          message: contact.message,
          createdAt: contact.createdAt,
        },
      });
    }
   
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error: any) {
    console.error("❌ Contact API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default authMiddleware(handler);
