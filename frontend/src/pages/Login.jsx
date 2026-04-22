import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f5f9",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    borderRadius: 24,
    boxShadow: "0 30px 80px rgba(15,23,42,0.12)",
    padding: 100,
  },
  title: {
    margin: 0,
    marginBottom: 24,
    fontSize: 28,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: 16,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 15,
    color: "#0f172a",
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  switchText: {
    marginTop: 18,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
  link: {
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { email, password };

      if (!isLogin) {
        payload.fullName = fullName;
        payload.avatarUrl = avatarUrl;
      }

      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await api.post(url, payload);

      localStorage.setItem("token", res.data.token);
      navigate("/chat");
    } catch (err) {
      setError(
        isLogin
          ? "Login failed. Check your credentials."
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isLogin ? "Welcome" : "Create your account"}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Avatar URL (optional)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </>
          )}

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        {error && (
          <div style={{ color: "#dc2626", marginTop: 12, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={styles.switchText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={styles.link} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Register" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
}
