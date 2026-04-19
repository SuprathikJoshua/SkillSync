import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email.js";

/**
 * Generate Access + Refresh Tokens
 */
export const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // IMPORTANT: must match schema field
  user.refreshTokenHash = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

/**
 * Register New User
 */
export const registerUser = async (userData) => {
  const { password } = userData;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // move plaintext password into passwordHash
  userData.passwordHash = password;
  delete userData.password;

  const user = await User.create(userData);
  return user;
};

/**
 * Login User
 * NOTE: returns null on failure (controller handles error)
 */
export const loginUser = async (identifier, password) => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  });

  if (!user) return null;

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) return null;

  return user;
};

/**
 * Logout User
 * Clears the refreshTokenHash from DB so the refresh token is invalidated
 */
export const logoutUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { refreshTokenHash: null } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return true;
};

/**
 * Forgot Password — generate token and send email
 */
export const forgotPasswordService = async (email) => {
  console.log("forgotPasswordService called with:", email);
  const user = await User.findOne({ email: email.toLowerCase() });
  console.log("user found:", user?._id);
  if (!user) throw new ApiError(404, "No account found with this email");

  const token  = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  user.passwordResetToken  = token;
  user.passwordResetExpiry = expiry;
  await user.save({ validateBeforeSave: false });
  console.log("token saved, sending email...");

  await sendPasswordResetEmail(user.email, token);
  console.log("email sent!");
  return true;
};
/**
 * Reset Password — verify token and update password
 */
export const resetPasswordService = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken:  token,
    passwordResetExpiry: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, "Reset link is invalid or has expired");

  user.passwordHash        = newPassword;
  user.passwordResetToken  = null;
  user.passwordResetExpiry = null;
  await user.save();
  return true;
};

/**
 * Send Verification Email
 */
export const sendVerificationEmailService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.isEmailVerified) throw new ApiError(400, "Email already verified");

  const token  = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerifyToken  = token;
  user.emailVerifyExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, token);
  return true;
};

/**
 * Verify Email Token
 */
export const verifyEmailService = async (token) => {
  const user = await User.findOne({
    emailVerifyToken:  token,
    emailVerifyExpiry: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, "Verification link is invalid or has expired");

  user.isEmailVerified   = true;
  user.emailVerifyToken  = null;
  user.emailVerifyExpiry = null;
  await user.save({ validateBeforeSave: false });
  return true;
};