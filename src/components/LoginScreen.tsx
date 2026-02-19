import { useState } from "react";

interface LoginScreenProps {
  onLogin(token: string): Promise<void>;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    const pat = tokenInput.trim();
    if (!pat) return;
    if (!pat.startsWith("ghp_")) {
      setError("Please use a Classic PAT (starts with ghp_). Fine-grained tokens are not supported.");
      return;
    }
    setError("");
    setLoggingIn(true);
    try {
      await onLogin(pat);
    } catch {
      setError("Invalid token. Make sure it has repo and read:user scopes.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="container">
      <h2 className="login-heading">PR Hub</h2>
      <p className="login-description">
        Enter a Classic Personal Access Token (starts with <b>ghp_</b>) with
        the following scopes:
      </p>
      <ul className="badge-list">
        <li className="badge badge--required">repo</li>
        <li className="badge badge--required">read:user</li>
      </ul>
      <input
        type="password"
        placeholder="ghp_…"
        value={tokenInput}
        onChange={(e) => setTokenInput(e.target.value)}
        className="input"
      />
      {error && <p className="error-text">{error}</p>}
      <button
        disabled={loggingIn || !tokenInput.trim()}
        onClick={handleLogin}
        className="btn-primary"
      >
        {loggingIn ? "Logging in…" : "Login"}
      </button>
    </div>
  );
}
