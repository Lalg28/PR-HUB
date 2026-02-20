import { useCallback, useEffect, useRef, useState } from "react";
import { validateToken, fetchAuthoredPRs, fetchReviewPRs, fetchMergedPRs } from "./github";
import type { GitHubUser, PullRequestItem } from "./types";
import { getToken, setToken, removeToken } from "./storage";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import { DashboardSkeleton } from "./components/Skeleton";

type Tab = "assigned" | "reviews" | "merged";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [assigned, setAssigned] = useState<PullRequestItem[]>([]);
  const [reviews, setReviews] = useState<PullRequestItem[]>([]);
  const [merged, setMerged] = useState<PullRequestItem[]>([]);
  const [error, setError] = useState("");
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const loadedTabsRef = useRef<Set<Tab>>(new Set());

  const loadTab = useCallback(async (tab: Tab, pat: string, username: string, force = false) => {
    if (!force && loadedTabsRef.current.has(tab)) return;
    setIsLoadingPRs(true);
    setError("");
    try {
      if (tab === "assigned") {
        setAssigned(await fetchAuthoredPRs(pat, username));
      } else if (tab === "reviews") {
        setReviews(await fetchReviewPRs(pat, username));
      } else {
        setMerged(await fetchMergedPRs(pat, username));
      }
      loadedTabsRef.current.add(tab);
    } catch {
      setError("Failed to load PRs.");
    } finally {
      setIsLoadingPRs(false);
    }
  }, []);

  async function handleLogin(pat: string) {
    setError("");
    const ghUser = await validateToken(pat);
    await setToken(pat);
    setTokenState(pat);
    setUser(ghUser);
    await loadTab("assigned", pat, ghUser.login);
  }

  async function logout() {
    await removeToken();
    setTokenState(null);
    setUser(null);
    setAssigned([]);
    setReviews([]);
    setMerged([]);
    loadedTabsRef.current = new Set();
  }

  function handleTabChange(tab: Tab) {
    if (token && user) {
      loadTab(tab, token, user.login);
    }
  }

  function handleReload(currentTab: Tab) {
    if (!token || !user) return;
    loadedTabsRef.current = new Set();
    setAssigned([]);
    setReviews([]);
    setMerged([]);
    loadTab(currentTab, token, user.login, true);
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
      merged={merged}
      isLoadingPRs={isLoadingPRs}
      error={error}
      onLogout={logout}
      onReload={handleReload}
      onTabChange={handleTabChange}
    />
  );
}
