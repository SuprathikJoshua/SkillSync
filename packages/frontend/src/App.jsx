import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SkillsWantedPage from "./pages/SkillWantedPage.jsx";
import SkillsOfferedPage from "./pages/SkillOfferedPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MySkillsPage from "./pages/MySkillsPage.jsx";
import RequestsPage from "./pages/RequestsPage.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import WalletPage from "./pages/WalletPage.jsx";
import BadgesPage from "./pages/BadgesPage.jsx";
import MatchmakingPage from "./pages/MatchmakingPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import FeedbackPage from "./pages/FeedbackPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

// Requires login
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

// Redirect logged-in users away from login/signup
const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Requires login AND Admin role
const AdminOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "Admin") return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => (
  <>
    <Toaster position="top-center" />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/skills-wanted"
        element={
          <Protected>
            <SkillsWantedPage />
          </Protected>
        }
      />
      <Route
        path="/skills-offered"
        element={
          <Protected>
            <SkillsOfferedPage />
          </Protected>
        }
      />
      <Route
        path="/my-skills"
        element={
          <Protected>
            <MySkillsPage />
          </Protected>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/requests"
        element={
          <Protected>
            <RequestsPage />
          </Protected>
        }
      />
      <Route
        path="/sessions"
        element={
          <Protected>
            <SessionsPage />
          </Protected>
        }
      />
      <Route
        path="/wallet"
        element={
          <Protected>
            <WalletPage />
          </Protected>
        }
      />
      <Route
        path="/badges"
        element={
          <Protected>
            <BadgesPage />
          </Protected>
        }
      />
      <Route
        path="/matchmaking"
        element={
          <Protected>
            <MatchmakingPage />
          </Protected>
        }
      />
      <Route
        path="/feedback"
        element={
          <Protected>
            <FeedbackPage />
          </Protected>
        }
      />
      <Route
        path="/feedback/:userId"
        element={
          <Protected>
            <FeedbackPage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminPage />
          </AdminOnly>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </>
);

export default App;
