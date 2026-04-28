import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import Progress from "./models/progress.models.js";
import Message from "./models/chat.models.js";
import jwt from "jsonwebtoken";
import { User } from "./models/user.models.js";

dotenv.config({ path: "./.env" });

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  },
});

// Socket auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select(
      "_id fullName username avatar",
    );
    if (!user) return next(new Error("Unauthorized"));
    socket.user = user;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

// Helper — sorted room ID
const roomId = (a, b) => [a.toString(), b.toString()].sort().join("_");

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();

  // Join personal room for direct delivery
  socket.join(userId);

  // Join a chat room
  socket.on("join_room", (otherUserId) => {
    socket.join(roomId(userId, otherUserId));
  });

  // Send message
  socket.on("send_message", async ({ toUserId, message }) => {
    if (!toUserId || !message?.trim()) return;
    try {
      const room = roomId(userId, toUserId);
      const saved = await Message.create({
        roomId: room,
        sender: socket.user._id,
        message: message.trim(),
      });
      const populated = await saved.populate(
        "sender",
        "fullName username avatar",
      );

      // Deliver to both users
      io.to(room).emit("receive_message", populated);
    } catch (err) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicator
  socket.on("typing", ({ toUserId, isTyping }) => {
    const room = roomId(userId, toUserId);
    socket.to(room).emit("user_typing", { userId, isTyping });
  });

  socket.on("disconnect", () => {});
});

// Weekly progress reset — every Monday at midnight
cron.schedule("0 0 * * 1", async () => {
  try {
    const now = new Date();
    const result = await Progress.updateMany(
      {},
      { $set: { weeklyHours: 0, weeklySessions: 0, weekStart: now } },
    );
    console.log(`Weekly progress reset for ${result.modifiedCount} users`);
  } catch (err) {
    console.error("Weekly reset cron failed:", err);
  }
});

connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    httpServer.listen(port, () => {
      console.log(`⚙️ Server is running at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!! ", err);
  });
