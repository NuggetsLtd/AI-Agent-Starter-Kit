import { Router, Request, Response, NextFunction } from "express";
import { ElizaBot } from "../services/eliza.nuggets.service.js";
import type { NuggetsChatContext } from "../types/nuggets.js";

const router = Router();
const eliza = new ElizaBot(); // Initialize your Eliza instance

// middleware to check that NODE_ENV is only local development
const checkNodeEnv = (_req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== "development") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

// handles nuggets didcomm messages received from end users
const handleElizaMessage = async (req: Request, res: Response) => {
  console.log("Received Eliza Message");
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const context: NuggetsChatContext = {
      message: {
        message_id: "",
        date: Date.now(),
        text: message,
      },
      from: {
        id: "",
      },
      chat: {
        id: "",
      },
    };

    const response = await eliza.respond(context);
    console.log({ response });
    res.json({ response });
  } catch (error) {
    console.error("Eliza error:", error);
    res.status(500).json({
      error: error.message || "Failed to get response from Eliza",
    });
  }
};

router.post("/", checkNodeEnv, handleElizaMessage);

export default router;
