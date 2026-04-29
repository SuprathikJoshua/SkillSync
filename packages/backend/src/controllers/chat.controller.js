import Message from "../models/chat.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Two users always get the same room — sorted IDs joined
export const getRoomId = (userA, userB) =>
  [userA.toString(), userB.toString()].sort().join("_");

// GET /chat/:userId — load message history with a user
export const getChatHistory = asyncHandler(async (req, res) => {
  const roomId = getRoomId(req.user._id, req.params.userId);
  const messages = await Message.find({ roomId })
    .populate("sender", "fullName username avatar")
    .sort({ createdAt: 1 })
    .limit(100);

  // Mark all as read
  await Message.updateMany(
    { roomId, sender: { $ne: req.user._id }, isRead: false },
    { $set: { isRead: true } },
  );

  res.json({ success: true, data: messages });
});

// GET /chat/unread — total unread count across all rooms
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    sender: { $ne: req.user._id },
    isRead: false,
    roomId: { $regex: req.user._id.toString() },
  });
  res.json({ success: true, data: { count } });
});
