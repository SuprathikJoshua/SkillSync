import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";
import toast from "react-hot-toast";
import DashboardNavbar from "../components/Dashboard/DashboardNavbar.jsx";
import Sidebar from "../components/Dashboard/SideBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

let socket = null;

const ChatPage = () => {
  const { userId: otherUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // Connect socket once
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    socket = io(
      import.meta.env.VITE_BACKEND_URL?.replace("/api/v1", "") ||
        "http://localhost:8000",
      {
        auth: { token },
        transports: ["websocket"],
      },
    );

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("receive_message", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("user_typing", ({ isTyping: t }) => {
      setIsTyping(t);
    });

    socket.emit("join_room", otherUserId);

    return () => {
      socket.disconnect();
      socket = null;
    };
  }, [otherUserId]);

  // Load other user info + history
  useEffect(() => {
    const load = async () => {
      try {
        const [histRes, userRes] = await Promise.all([
          API.get(`/chat/${otherUserId}`),
          API.get(`/users/${otherUserId}`),
        ]);
        setMessages(histRes.data.data || []);
        setOtherUser(userRes.data.data);
      } catch {
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [otherUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || !connected) return;
    socket.emit("send_message", {
      toUserId: otherUserId,
      message: input.trim(),
    });
    setInput("");
    socket.emit("typing", { toUserId: otherUserId, isTyping: false });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (socket) {
      socket.emit("typing", { toUserId: otherUserId, isTyping: true });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit("typing", { toUserId: otherUserId, isTyping: false });
      }, 1500);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const day = formatDate(msg.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <p className="text-secondary">Loading chat...</p>
      </div>
    );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <DashboardNavbar user={user} />
      <Sidebar />
      <main
        style={{
          paddingTop: "4rem",
          paddingLeft: "15rem",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chat header */}
        <div
          className="flex items-center gap-4 px-6 py-4 border-b"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "20px",
            }}
          >
            ←
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            {otherUser?.fullName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-primary text-sm">
              {otherUser?.fullName || "User"}
            </p>
            <p
              className="text-xs"
              style={{ color: connected ? "#34d399" : "var(--text-muted)" }}
            >
              {connected ? "● Online" : "○ Connecting..."}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                💬
              </div>
              <p className="text-secondary font-medium">No messages yet</p>
              <p className="text-xs text-muted">
                Say hi to {otherUser?.fullName}!
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([day, msgs]) => (
              <div key={day}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                  <span className="text-xs text-muted px-2">{day}</span>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                </div>
                {msgs.map((msg) => {
                  const isMine =
                    msg.sender._id?.toString() === user?._id?.toString() ||
                    msg.sender?.toString() === user?._id?.toString();
                  return (
                    <div
                      key={msg._id}
                      className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 mr-2 mt-1"
                          style={{
                            background:
                              "linear-gradient(135deg,#4f46e5,#7c3aed)",
                          }}
                        >
                          {(msg.sender?.fullName || otherUser?.fullName || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div style={{ maxWidth: "65%" }}>
                        <div
                          className="px-4 py-2.5 rounded-2xl text-sm"
                          style={
                            isMine
                              ? {
                                  background:
                                    "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                  color: "white",
                                  borderBottomRightRadius: "4px",
                                }
                              : {
                                  backgroundColor: "var(--bg-card)",
                                  color: "var(--text-primary)",
                                  border: "1px solid var(--border)",
                                  borderBottomLeftRadius: "4px",
                                }
                          }
                        >
                          {msg.message}
                        </div>
                        <p
                          className={`text-xs text-muted mt-1 ${isMine ? "text-right" : "text-left"}`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                }}
              >
                {otherUser?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div
                className="px-4 py-2.5 rounded-2xl"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "var(--text-muted)",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-6 py-4 border-t"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser?.fullName || ""}...`}
              rows={1}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: "1.5",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !connected}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity"
              style={{
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                border: "none",
                cursor: input.trim() && connected ? "pointer" : "not-allowed",
                opacity: input.trim() && connected ? 1 : 0.5,
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-muted mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
