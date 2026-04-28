import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import DashboardNavbar from "../components/Dashboard/DashboardNavbar.jsx";
import Sidebar from "../components/Dashboard/SideBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const scoreStyle = (s) =>
  s >= 80
    ? { color: "#34d399", bg: "rgba(52,211,153,0.12)" }
    : s >= 50
      ? { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" }
      : { color: "#818cf8", bg: "rgba(129,140,248,0.12)" };
const inp = {
  width: "100%",
  marginTop: "0.25rem",
  padding: "0.7rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--border)",
  backgroundColor: "var(--bg-secondary)",
  color: "var(--text-primary)",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
};

const MatchmakingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ skillId: "", message: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const [m, s] = await Promise.allSettled([
          API.get("/matchmaking"),
          API.get("/skills"),
        ]);
        if (m.status === "fulfilled")
          setMatches(m.value.data.matches || m.value.data.data || []);
        else toast.error("Could not load matches");
        if (s.status === "fulfilled") setSkills(s.value.data.data || []);
      } catch {
        toast.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRequest = async () => {
    if (!form.skillId) {
      toast.error("Select a skill");
      return;
    }
    try {
      await API.post("/requests/add-request", {
        toUserId: modal._id,
        skillId: form.skillId,
        message: form.message,
      });
      toast.success(`Request sent to ${modal.name}!`);
      setModal(null);
      setForm({ skillId: "", message: "" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send request");
    }
  };

  const filtered = matches
    .filter(
      (m) =>
        !query ||
        m.user.name?.toLowerCase().includes(query.toLowerCase()) ||
        m.commonSkills?.some((s) =>
          s.toLowerCase().includes(query.toLowerCase()),
        ),
    )
    .sort((a, b) =>
      sortBy === "score"
        ? b.matchScore - a.matchScore
        : a.user.name?.localeCompare(b.user.name),
    );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <DashboardNavbar user={user} />
      <Sidebar />
      <main className="pt-16 pl-60 p-8">
        <div>
          <div
            style={{
              background:
                "linear-gradient(135deg,rgba(79,70,229,0.15) 0%,rgba(124,58,237,0.08) 100%)",
              borderBottom: "1px solid var(--border)",
              padding: "2rem 2.5rem 1.5rem",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-primary">
                  Matchmaking
                </h1>
                <p className="text-secondary mt-1 text-sm">
                  People whose skills complement yours
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                {
                  label: "Total Matches",
                  val: matches.length,
                  color: "#818cf8",
                },
                {
                  label: "Strong Matches",
                  val: matches.filter((m) => m.matchScore >= 80).length,
                  color: "#34d399",
                },
                {
                  label: "Avg Match Score",
                  val: matches.length
                    ? `${Math.round(matches.reduce((a, m) => a + m.matchScore, 0) / matches.length)}%`
                    : "0%",
                  color: "#fbbf24",
                },
              ].map(({ label, val, color }) => (
                <div key={label} className="card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color }}>
                    {val}
                  </p>
                  <p className="text-xs text-secondary mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 max-w-4xl space-y-5">
            {/* Search + Sort */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  fill="none"
                  stroke="var(--text-muted)"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" strokeWidth="2" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or skill…"
                  style={{ ...inp, paddingLeft: "2.25rem", marginTop: 0 }}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  ...inp,
                  width: "auto",
                  marginTop: 0,
                  cursor: "pointer",
                }}
              >
                <option value="score">Best match</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            {/* Results */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl animate-pulse"
                    style={{ backgroundColor: "var(--bg-card)" }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card rounded-2xl p-16 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium text-secondary">No matches found</p>
                <p className="text-xs text-muted mt-1">
                  Add skills from My Skills page to get matched
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  {filtered.length} match{filtered.length !== 1 ? "es" : ""}
                </p>
                {filtered.map((m) => {
                  const { color, bg } = scoreStyle(m.matchScore);
                  return (
                    <div key={m.user._id} className="card rounded-2xl p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg,#4f46e5,#7c3aed)",
                            }}
                          >
                            {m.user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-primary">
                              {m.user.name}
                            </p>
                            <p className="text-xs text-secondary">
                              {m.user.bio || "SkillSync member"}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-sm font-bold px-3 py-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: bg, color }}
                        >
                          {m.matchScore}% match
                        </span>
                      </div>
                      {m.commonSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {m.commonSkills.map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: "rgba(129,140,248,0.12)",
                                color: "#818cf8",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(m.user)}
                          className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
                          style={{
                            background:
                              "linear-gradient(135deg,#4f46e5,#7c3aed)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Send Request
                        </button>
                        <button
                          onClick={() => navigate(`/chat/${m.user._id}`)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                        >
                          💬 Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Request Modal */}
      {modal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div className="card rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">Send Request</h2>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: "20px",
                }}
              >
                ×
              </button>
            </div>
            <div
              className="flex items-center gap-3 mb-6 p-3 rounded-xl"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                }}
              >
                {modal.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-primary text-sm">
                  {modal.name}
                </p>
                <p className="text-xs text-secondary">
                  {modal.bio || "SkillSync member"}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Skill
                </label>
                <select
                  value={form.skillId}
                  onChange={(e) =>
                    setForm({ ...form, skillId: e.target.value })
                  }
                  style={inp}
                >
                  <option value="">Select a skill…</option>
                  {skills.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Message (optional)
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Hi! I'd love to exchange skills with you…"
                  style={{ ...inp, resize: "none" }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setModal(null);
                  setForm({ skillId: "", message: "" });
                }}
                className="flex-1 py-3 rounded-xl text-secondary text-sm"
                style={{
                  border: "1px solid var(--border)",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchmakingPage;
