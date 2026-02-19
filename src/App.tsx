import { useEffect, useState } from "react";
import { validateToken, fetchAllPRs } from "./github";
import type { GitHubUser, PullRequestItem } from "./types";
import { getToken, setToken, removeToken } from "./storage";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import { DashboardSkeleton } from "./components/Skeleton";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [assigned, setAssigned] = useState<PullRequestItem[]>([]);
  const [reviews, setReviews] = useState<PullRequestItem[]>([]);
  const [error, setError] = useState("");
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);

  async function loadPRs(pat: string, username: string) {
    setIsLoadingPRs(true);
    try {
      const { authored, reviewRequested } = await fetchAllPRs(pat, username);
      setAssigned(authored);
      setReviews(reviewRequested);
    } catch {
      setError("Failed to load PRs.");
    } finally {
      setIsLoadingPRs(false);
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
    getToken().then((storedToken) => {
      if (storedToken) {
        handleLogin(storedToken).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={user}
      assigned={assigned}
      reviews={reviews}
      isLoadingPRs={isLoadingPRs}
      error={error}
      onLogout={logout}
      onReload={() => loadPRs(token, user.login)}
    />
  );
}
