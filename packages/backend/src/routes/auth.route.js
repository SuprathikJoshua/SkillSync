import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {
  registerUserController,
  loginUserController,
  getCurrentUserController,
  refreshTokenController,
  changePasswordController,
  logoutUserController,
  forgotPasswordController,
  resetPasswordController,
  sendVerificationEmailController,
  verifyEmailController,
  googleCallbackController,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// ─── Google OAuth — lazy init so env vars are loaded first ───────────────────
const initGoogleStrategy = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth env vars missing — /auth/google disabled");
    return;
  }
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/v1/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  ));
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};

initGoogleStrategy();

// ─── Standard routes ─────────────────────────────────────────────────────────
router.post("/register",                  registerUserController);
router.post("/login",                     loginUserController);
router.get("/current-user",  verifyJWT,   getCurrentUserController);
router.post("/refresh-token",             refreshTokenController);
router.post("/change-password", verifyJWT, changePasswordController);
router.post("/logout",       verifyJWT,   logoutUserController);
router.post("/forgot-password",           forgotPasswordController);
router.post("/reset-password",            resetPasswordController);
router.post("/resend-email-verification", verifyJWT, sendVerificationEmailController);
router.get("/verify-email/:token",        verifyEmailController);

// ─── Google OAuth routes ──────────────────────────────────────────────────────
router.get("/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google OAuth not configured" });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  }
);

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallbackController
);

export default router;