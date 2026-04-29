import { Router } from "express";
import {
  getChatHistory,
  getUnreadCount,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/unread", verifyJWT, getUnreadCount);
router.get("/:userId", verifyJWT, getChatHistory);

export default router;
