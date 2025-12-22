import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectDB } from "../../utils/db";
import {
  authMiddleware,
  corsMiddleware,
} from "../../utils/middleware";
import Newsletter from "../../models/newsletter.model";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  corsMiddleware(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === "POST") {
      console.log("===================",req)
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // const exists = await Newsletter.findOne({
      //   email: email.toLowerCase(),
      // });

      // if (exists) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Email already subscribed",
      //   });
      // }

      const subscriber = await Newsletter.create({
        email: email.trim().toLowerCase(),
      });

      res.setHeader("Cache-Control", "no-store");

      return res.status(201).json({
        success: true,
        message: "Subscribed successfully",
        data: {
          id: subscriber._id,
          email: subscriber.email,
          createdAt: subscriber.createdAt,
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error: any) {
    console.error("❌ Newsletter API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default authMiddleware(handler);
