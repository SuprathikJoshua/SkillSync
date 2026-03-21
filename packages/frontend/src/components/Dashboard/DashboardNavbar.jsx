import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../api/axios";
import NotificationsDropdown from "./Notifications.jsx";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext.jsx";

const NOTIF_ICONS = {
  request_received: "📨",
  request_accepted: "✅",
  request_rejected: "❌",
  session_created: "📅",
  session_completed: "🎉",
  session_cancelled: "🚫",
  feedback_received: "⭐",
};

const BellIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.424-1.921M5.429 9.75a20.863 20.863 0 012.402-5.231m0 0a20.844 20.844 0 014.882-2.001A6.44 6.44 0 0112 2.75c1.397 0 2.749.356 3.887 1.018a20.844 20.844 0 014.882 2.001m0 0A21.064 21.064 0 0123.75 12c0 5.684-4.316 10.5-10 10.5S3.75 17.684 3.75 12c0-1.935.495-3.759 1.372-5.25m19.874 0c.083.715.11 1.447.11 2.25 0 5.684-4.316 10.5-10 10.5S2.75 17.684 2.75 12c0-.803.027-1.535.11-2.25m19.874 0a24.614 24.614 0 00-1.902-3.846m-2.893-1.421a9.042 9.042 0 00-5.824-1.884c-3.956 0-7.298 2.016-9.25 5.084m16.294 6.744a9.042 9.042 0 01-9.25 5.084c-3.956 0-7.298-2.016-9.25-5.084m16.294-6.744l-2.893 1.421"
    />
  </svg>
);

const MessageIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v-.243a2.25 2.25 0 00-1.07-1.916l-7.007-4.471a2.25 2.25 0 00-2.36 0l-7.007 4.472a2.25 2.25 0 00-1.07 1.916v.243"
    />
  </svg>
);

const Logo = () => (
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500">
      <div className="w-4 h-4 rounded-full border-2 border-white bg-red-400"></div>
    </div>
    <span className="text-xl font-semibold text-primary dark:text-white">
      SkillSync
    </span>
  </div>
);

const DashboardNavbar = ({ user }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { darkMode, toggleDarkMode } = useTheme();
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifs(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((c) => {
        const notif = notifications.find((n) => n._id === id);
        return notif && !notif.isRead ? Math.max(0, c - 1) : c;
      });
    } catch {}
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) handleMarkAsRead(notif._id);
    if (notif.link) navigate(notif.link);
    setShowNotifs(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
    } finally {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <header className="navbar fixed top-0 left-0 right-0 h-16 z-40">
      <div className="flex items-center justify-between h-full px-6">
        <Logo />

        <div className="flex items-center space-x-5 text-muted">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="text-xl hover:scale-110 transition-transform"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          {/* Bell — Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowDropdown(false);
              }}
              className="relative cursor-pointer hover:text-indigo-600 transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-3xl mb-2">🔔</p>
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0 transition-colors ${
                          !n.isRead ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                        }`}
                      >
                        <span className="text-xl flex-shrink-0 mt-0.5">
                          {NOTIF_ICONS[n.type] || "🔔"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}
                          >
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(n.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                            {" · "}
                            {new Date(n.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotif(e, n._id)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0 mt-0.5"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Message icon */}
          <div className="relative cursor-pointer">
            <MessageIcon className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-primary">SkillSync</span>
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifs(false);
            }}
            className="w-9 h-9 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center hover:bg-indigo-600"
          >
            {user?.fullName?.charAt(0).toUpperCase() || "U"}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50">
              <div className="px-4 py-3 border-b dark:border-gray-700">
                <p className="font-semibold text-primary dark:text-white">
                  {user?.fullName}
                </p>
                <p className="text-xs text-muted dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/profile");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                👤 Profile
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/settings");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
