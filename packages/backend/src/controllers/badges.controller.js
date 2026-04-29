import { UserBadge } from "../models/userBadge.models.js";
import Session from "../models/session.models.js";
import Wallet from "../models/wallet.models.js";
import { User } from "../models/user.models.js";
import Feedback from "../models/feedback.models.js";
import Request from "../models/request.models.js";

const BADGE_DEFS = [
  { id: "first_session", threshold: 1, category: "sessions" },
  { id: "five_sessions", threshold: 5, category: "sessions" },
  { id: "ten_sessions", threshold: 10, category: "sessions" },
  { id: "first_teach", threshold: 1, category: "teaching" },
  { id: "five_teach", threshold: 5, category: "teaching" },
  { id: "skill_diverse", threshold: 3, category: "skills" },
  { id: "wallet_100", threshold: 100, category: "wallet" },
  { id: "top_rated", threshold: 5, category: "rating" },
  { id: "early_adopter", threshold: 1, category: "special" },
  { id: "profile_complete", threshold: 1, category: "profile" },
  { id: "request_sent_5", threshold: 5, category: "requests" },
];

export async function syncBadges(userId) {
  const [
    totalSessions,
    teachSessions,
    distinctSkills,
    wallet,
    user,
    feedbacks,
    requestsSent,
  ] = await Promise.all([
    Session.countDocuments({ learnerId: userId, status: "completed" }),
    Session.countDocuments({ teacherId: userId, status: "completed" }),
    Session.distinct("skillId", {
      $or: [{ learnerId: userId }, { teacherId: userId }],
      status: "completed",
    }),
    Wallet.findOne({ userId }),
    User.findById(userId),
    Feedback.find({ toUser: userId }, "rating"),
    Request.countDocuments({ fromUserId: userId }),
  ]);

  // Compute real average rating
  const averageRating = feedbacks.length
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

  const profileComplete =
    user?.fullName && user?.bio && user?.skillsToTeach?.length ? 1 : 0;

  const LAUNCH_DATE = new Date("2024-11-01");
  const earlyAdopter =
    user && new Date(user.createdAt) - LAUNCH_DATE < 30 * 86400000 ? 1 : 0;

  const progressMap = {
    first_session: totalSessions,
    five_sessions: totalSessions,
    ten_sessions: totalSessions,
    first_teach: teachSessions,
    five_teach: teachSessions,
    skill_diverse: distinctSkills.length,
    wallet_100: wallet?.balance ?? 0,
    top_rated: averageRating,
    early_adopter: earlyAdopter,
    profile_complete: profileComplete,
    request_sent_5: requestsSent,
  };

  for (const def of BADGE_DEFS) {
    const val = progressMap[def.id] ?? 0;
    const earned = val >= def.threshold;
    await UserBadge.findOneAndUpdate(
      { user: userId, badgeId: def.id },
      {
        $set: {
          progress: val,
          earned,
          ...(earned ? { earnedAt: new Date() } : {}),
        },
        $setOnInsert: { user: userId, badgeId: def.id },
      },
      { upsert: true },
    );
  }
}

export const getMyBadgesController = async (req, res) => {
  try {
    await syncBadges(req.user._id);
    const badges = await UserBadge.find({ user: req.user._id });
    res.json({ badges });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getUserBadgesController = async (req, res) => {
  try {
    const badges = await UserBadge.find({ user: req.params.id, earned: true });
    res.json({ badges });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const syncBadgesController = async (req, res) => {
  try {
    await syncBadges(req.user._id);
    res.json({ message: "Badges synced" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
