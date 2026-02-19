import { useState } from "react";
import type { GitHubUser, PullRequestItem } from "../github";
import PRList from "./PRList";

type Tab = "assigned" | "reviews";

interface DashboardProps {
  user: GitHubUser;
  assigned: PullRequestItem[];
  reviews: PullRequestItem[];
  prLoading: boolean;
  error: string;
  onLogout(): void;
}

export default function Dashboard({ user, assigned, reviews, prLoading, error, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>("assigned");

  const pendingReviews = reviews.filter((pr) => pr.my_review_status === "PENDING");
  const reviewedPRs = reviews.filter((pr) => pr.my_review_status && pr.my_review_status !== "PENDING");

  return (
    <div className="dashboard">
      <div className="dashboard-fixed">
        <div className="header">
          <a
            href={`https://github.com/${user.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="header-profile"
          >
            <img src={user.avatar_url} alt={user.login} className="avatar" />
            <span className="header-username">{user.login}</span>
          </a>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="tab-bar">
          {(["assigned", "reviews"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-button${tab === t ? " tab-button--active" : ""}`}
            >
              {t === "assigned" ? `My PRs (${assigned.length})` : `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-scroll">
        {prLoading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-pr-item">
                <div className="skeleton skeleton-line skeleton-line--medium" />
                <div className="skeleton skeleton-line skeleton-line--short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : tab === "assigned" ? (
          <PRList
            prs={assigned}
            emptyMessage="No open PRs assigned to you."
            showChecks
          />
        ) : (
          <>
            <h3 className="section-heading">Pending review ({pendingReviews.length})</h3>
            <PRList
              prs={pendingReviews}
              emptyMessage="No pending reviews."
              showAuthor
              showMyReview
            />
            {reviewedPRs.length > 0 && (
              <>
                <h3 className="section-heading section-heading--spaced">Reviewed ({reviewedPRs.length})</h3>
                <PRList
                  prs={reviewedPRs}
                  emptyMessage=""
                  showAuthor
                  showMyReview
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
