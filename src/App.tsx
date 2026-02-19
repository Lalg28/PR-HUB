import { useEffect, useState } from "react";
import {
  validateToken,
  fetchAllPRs,
  type GitHubUser,
  type PullRequestItem,
} from "./github";
import { getToken, setToken, removeToken } from "./storage";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [assigned, setAssigned] = useState<PullRequestItem[]>([]);
  const [reviews, setReviews] = useState<PullRequestItem[]>([]);
  const [error, setError] = useState("");
  const [prLoading, setPrLoading] = useState(false);

  async function loadPRs(pat: string, username: string) {
    setPrLoading(true);
    try {
      const { authored, reviewRequested } = await fetchAllPRs(pat, username);
      setAssigned(authored);
      setReviews(reviewRequested);
    } catch {
      setError("Failed to load PRs.");
    } finally {
      setPrLoading(false);
    }
  }

  async function handleLogin(pat: string) {
    setError("");
    const ghUser = await validateToken(pat);
    await setToken(pat);
    setTokenState(pat);
    setUser(ghUser);
    await loadPRs(pat, ghUser.login);
  }

  async function logout() {
    await removeToken();
    setTokenState(null);
    setUser(null);
    setAssigned([]);
    setReviews([]);
  }

  useEffect(() => {
    getToken().then((t) => {
      if (t) {
        handleLogin(t).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="skeleton-header">
          <div className="skeleton skeleton-header-name" />
          <div className="skeleton skeleton-header-action" />
        </div>
        <div className="skeleton-tabs">
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-tab" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-pr-item">
            <div className="skeleton skeleton-line skeleton-line--medium" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    );
  }

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={user}
      assigned={assigned}
      reviews={reviews}
      prLoading={prLoading}
      error={error}
      onLogout={logout}
    />
  );
}
