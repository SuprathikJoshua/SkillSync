import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const OAuthCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const user = params.get("user");

    if (token && user) {
      try {
        localStorage.setItem("accessToken", token);
        login(JSON.parse(decodeURIComponent(user)));
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-secondary text-sm">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
