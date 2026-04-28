import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

const s = {
  panel: { backgroundColor: "var(--bg-secondary)" },
  card: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "1.5rem",
    padding: "2.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    marginTop: "0.25rem",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    marginBottom: "0.25rem",
  },
  title: {
    color: "var(--text-primary)",
    fontSize: "1.875rem",
    fontWeight: "700",
    marginBottom: "0.25rem",
  },
  sub: {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    marginBottom: "2rem",
  },
  btn: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.75rem",
    background: "linear-gradient(135deg, #0d9488, #0891b2)",
    color: "white",
    fontWeight: "600",
    fontSize: "0.875rem",
    border: "none",
    cursor: "pointer",
  },
};

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isSignup = location.pathname === "/signup";

  const initialFormState = {
    fullName: "",
    username: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
    role: "Learner",
    identifier: "",
  };

  const [formData, setFormData] = React.useState(initialFormState);
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (
      !isSignup &&
      (!formData.identifier.trim() || !formData.password.trim())
    ) {
      toast.error("Please fill all fields");
      return;
    }
    if (isSignup) {
      if (
        !formData.fullName.trim() ||
        !formData.username.trim() ||
        !formData.email.trim() ||
        !formData.password.trim()
      ) {
        toast.error("Please fill all required fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }
    setLoading(true);
    try {
      if (isSignup) {
        const res = await axios.post("/auth/register", {
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          age: formData.age,
          password: formData.password,
          role: formData.role,
        });
        const token = res.data?.data?.accessToken || "1";
        localStorage.setItem("accessToken", token);
        login(res.data?.data?.user);
        toast.success("Account created!");
        navigate("/skills-wanted");
      } else {
        const res = await axios.post("/auth/login", {
          identifier: formData.identifier.trim(),
          password: formData.password,
        });
        const token =
          res.data?.data?.accessToken || res.data?.accessToken || "1";
        localStorage.setItem("accessToken", token);
        login(res.data?.data?.user);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (isSignup ? "Signup failed" : "Invalid credentials"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* ── LEFT — teal gradient ── */}
      <div
        className="hidden md:flex w-1/2 flex-col justify-center px-16 lg:px-24 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10">
          <div
            className="w-12 h-12 rounded-2xl mb-6 flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <span className="text-white font-black text-xl">S</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">SkillSync</h1>
          <p
            className="text-lg mb-10"
            style={{ color: "rgba(204,251,241,0.9)" }}
          >
            Learn by Teaching, Teach by Learning
          </p>
          <h2 className="text-5xl font-extrabold leading-tight">
            Exchange Skills.
            <br />
            <span style={{ color: "#fde047" }}>Build Your Future.</span>
          </h2>
          <div className="flex flex-wrap gap-3 mt-10">
            {["Smart Matchmaking", "Token Economy", "Badges & XP"].map((f) => (
              <div
                key={f}
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — dark panel ── */}
      <div
        className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12"
        style={s.panel}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0d9488, #0891b2)",
              }}
            >
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              SkillSync
            </span>
          </div>

          <div style={s.card}>
            <h3 style={s.title}>
              {isSignup ? "Create Account 🚀" : "Welcome Back 👋"}
            </h3>
            <p style={s.sub}>
              {isSignup
                ? "Join thousands of skill exchangers"
                : "Sign in to your account"}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <div>
                    <label style={s.label}>Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      style={s.input}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Username</label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Username"
                      style={s.input}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Email</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      style={s.input}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Age</label>
                    <input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Age"
                      style={s.input}
                    />
                  </div>
                </>
              )}

              {!isSignup && (
                <div>
                  <label style={s.label}>Email or Username</label>
                  <input
                    id="identifier"
                    type="text"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder="Email or Username"
                    style={s.input}
                  />
                </div>
              )}

              <div>
                <label style={s.label}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  style={s.input}
                />
              </div>

              {isSignup && (
                <>
                  <div>
                    <label style={s.label}>Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      style={s.input}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Role</label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={handleChange}
                      style={{ ...s.input, cursor: "pointer" }}
                    >
                      <option value="Learner">Learner</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...s.btn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>

            <p
              className="text-center text-sm mt-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <Link
                to={isSignup ? "/login" : "/signup"}
                style={{
                  color: "#0d9488",
                  fontWeight: "600",
                  marginLeft: "4px",
                }}
              >
                {isSignup ? "Login" : "Sign up"}
              </Link>
            </p>

            {!isSignup && (
              <p className="text-center text-sm mt-2">
                <Link
                  to="/forgot-password"
                  style={{ color: "var(--text-muted)" }}
                >
                  Forgot your password?
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
