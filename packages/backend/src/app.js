import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import userSkillRoute from "./routes/userSkill.route.js";
import skillRoute from "./routes/skills.route.js";
import requestRoute from "./routes/request.routes.js";
import sessionRoute from "./routes/session.routes.js";
import walletRoute from "./routes/wallet.route.js";
import healthCheckRoute from "./routes/healthcheck.route.js";
import feedbackRouter from "./routes/feedback.routes.js";
import progressRoute from "./routes/progress.route.js";
import badgesRoute from "./routes/badges.route.js";
import matchmakingRoute from "./routes/matchmaking.route.js";
import notificationsRoute from "./routes/notification.route.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.CORS_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ── Rate limiting — disabled in dev ──────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: () => !isProd,
  message: { status: 429, message: "Too many auth attempts." },
});

app.use(limiter);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/user-skills", userSkillRoute);
app.use("/api/v1/skills", skillRoute);
app.use("/api/v1/requests", requestRoute);
app.use("/api/v1/sessions", sessionRoute);
app.use("/api/v1/wallet", walletRoute);
app.use("/api/v1/healthcheck", healthCheckRoute);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/progress", progressRoute);
app.use("/api/v1/badges", badgesRoute);
app.use("/api/v1/matchmaking", matchmakingRoute);
app.use("/api/v1/notifications", notificationsRoute);

// Upload route (only if multer installed)
try {
  const { default: uploadRoute } = await import("./routes/upload.route.js");
  app.use("/api/v1/upload", uploadRoute);
} catch {
  /* skip if not installed */
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
