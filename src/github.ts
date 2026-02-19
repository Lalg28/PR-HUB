export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export type CheckStatus = "success" | "failure" | "pending";
export type ReviewStatus = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING";

export interface PullRequestItem {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  created_at: string;
  comments: number;
  user?: { login: string; avatar_url: string };
  check_status?: CheckStatus;
  approvals?: number;
  changes_requested?: number;
  my_review_status?: ReviewStatus;
}

interface SearchResponse {
  items: PullRequestItem[];
}

interface PRDetail {
  head: { sha: string };
  comments: number;
  review_comments: number;
}

interface Review {
  state: string;
  user: { login: string };
}

interface CombinedStatus {
  state: string;
  total_count: number;
}

const API = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}

export async function validateToken(token: string): Promise<GitHubUser> {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error("Invalid token");
  return res.json();
}

async function searchPRs(token: string, query: string): Promise<PullRequestItem[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(`${API}/search/issues?q=${q}&per_page=100`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`Search failed: ${query}`);
  const data: SearchResponse = await res.json();
  return data.items;
}

async function enrichPR(
  token: string,
  pr: PullRequestItem,
): Promise<PullRequestItem> {
  const repo = getRepoName(pr.repository_url);

  try {
    // Fetch PR details, reviews, commit status, and check-runs in parallel
    const [prRes, reviewsRes] = await Promise.all([
      fetch(`${API}/repos/${repo}/pulls/${pr.number}`, { headers: headers(token) }),
      fetch(`${API}/repos/${repo}/pulls/${pr.number}/reviews`, { headers: headers(token) }),
    ]);

    // Reviews: count latest review per user
    let approvals = 0;
    let changes_requested = 0;
    if (reviewsRes.ok) {
      const reviews: Review[] = await reviewsRes.json();
      // Keep only the latest review per user
      const latest = new Map<string, string>();
      for (const r of reviews) {
        if (r.state === "APPROVED" || r.state === "CHANGES_REQUESTED") {
          latest.set(r.user.login, r.state);
        }
      }
      for (const state of latest.values()) {
        if (state === "APPROVED") approvals++;
        else if (state === "CHANGES_REQUESTED") changes_requested++;
      }
    }

    // Comments: sum issue comments (from search) + review comments (from PR detail)
    let totalComments = pr.comments ?? 0;
    let headSha = "";
    if (prRes.ok) {
      const detail: PRDetail = await prRes.json();
      totalComments += detail.review_comments ?? 0;
      headSha = detail.head.sha;
    }

    // Check status from commit status + check-runs
    let check_status: CheckStatus = "pending";
    if (headSha) {
      const [statusRes, checksRes] = await Promise.all([
        fetch(`${API}/repos/${repo}/commits/${headSha}/status`, { headers: headers(token) }),
        fetch(`${API}/repos/${repo}/commits/${headSha}/check-runs`, { headers: headers(token) }),
      ]);

      let commitState = "pending";
      let commitCount = 0;
      if (statusRes.ok) {
        const status: CombinedStatus = await statusRes.json();
        commitState = status.state;
        commitCount = status.total_count;
      }

      let checksConclusion: CheckStatus = "pending";
      if (checksRes.ok) {
        const checks: { total_count: number; check_runs: { conclusion: string | null; status: string }[] } =
          await checksRes.json();
        if (checks.total_count > 0) {
          const hasFailure = checks.check_runs.some(
            (c) => c.conclusion === "failure" || c.conclusion === "timed_out" || c.conclusion === "cancelled",
          );
          const allComplete = checks.check_runs.every((c) => c.status === "completed");
          if (hasFailure) checksConclusion = "failure";
          else if (allComplete) checksConclusion = "success";
        }
      }

      if (commitState === "failure" || commitState === "error" || checksConclusion === "failure") {
        check_status = "failure";
      } else if (commitCount === 0 && checksConclusion === "pending") {
        check_status = "pending";
      } else if (commitState === "pending" || checksConclusion === "pending") {
        check_status = "pending";
      } else {
        check_status = "success";
      }
    }

    return { ...pr, comments: totalComments, check_status, approvals, changes_requested };
  } catch {
    return pr;
  }
}

async function enrichReviewPR(
  token: string,
  pr: PullRequestItem,
  username: string,
): Promise<PullRequestItem> {
  const repo = getRepoName(pr.repository_url);
  try {
    const res = await fetch(
      `${API}/repos/${repo}/pulls/${pr.number}/reviews`,
      { headers: headers(token) },
    );
    if (!res.ok) return { ...pr, my_review_status: "PENDING" };
    const reviews: Review[] = await res.json();
    // Find the latest review by the current user
    let myStatus: ReviewStatus = "PENDING";
    for (const r of reviews) {
      if (r.user.login === username && (r.state === "APPROVED" || r.state === "CHANGES_REQUESTED" || r.state === "COMMENTED")) {
        myStatus = r.state as ReviewStatus;
      }
    }
    return { ...pr, my_review_status: myStatus };
  } catch {
    return { ...pr, my_review_status: "PENDING" };
  }
}

function twoWeeksAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().split("T")[0];
}

export async function fetchAllPRs(
  token: string,
  username: string,
): Promise<{ authored: PullRequestItem[]; reviewRequested: PullRequestItem[] }> {
  const since = twoWeeksAgo();

  const [authored, pendingReviews, reviewedByMe] = await Promise.all([
    searchPRs(token, `type:pr author:${username} is:open`),
    searchPRs(token, `type:pr review-requested:${username} is:open created:>${since}`),
    searchPRs(token, `type:pr reviewed-by:${username} is:open created:>${since}`),
  ]);

  // Merge and deduplicate review PRs
  const seen = new Set<number>();
  const allReviews: PullRequestItem[] = [];
  for (const pr of [...pendingReviews, ...reviewedByMe]) {
    if (!seen.has(pr.id)) {
      seen.add(pr.id);
      allReviews.push(pr);
    }
  }

  // Enrich both tabs in parallel
  const [enrichedAuthored, enrichedReviews] = await Promise.all([
    Promise.all(authored.map((pr) => enrichPR(token, pr))),
    Promise.all(allReviews.map((pr) => enrichReviewPR(token, pr, username))),
  ]);

  return { authored: enrichedAuthored, reviewRequested: enrichedReviews };
}

export function getRepoName(repositoryUrl: string): string {
  return repositoryUrl.replace(`${API}/repos/`, "");
}
