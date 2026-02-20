import { useState } from "react";
import type { GitHubUser, PullRequestItem } from "../types";
import { openOrFocusTab } from "../tabs";
import PRList from "./PRList";
import { PRListSkeleton } from "./Skeleton";

type Tab = "assigned" | "reviews" | "merged";

interface DashboardProps {
  user: GitHubUser;
  assigned: PullRequestItem[];
  reviews: PullRequestItem[];
  merged: PullRequestItem[];
  isLoadingPRs: boolean;
  error: string;
  onLogout(): void;
  onReload(currentTab: Tab): void;
  onTabChange(tab: Tab): void;
}

export default function Dashboard({ user, assigned, reviews, merged, isLoadingPRs, error, onLogout, onReload, onTabChange }: DashboardProps) {
  const [tab, setTab] = useState<Tab>("assigned");

  const pendingReviews = reviews.filter((pr) => pr.my_review_status === "PENDING");
  const reviewedPRs = reviews.filter((pr) => pr.my_review_status && pr.my_review_status !== "PENDING");

  return (
    <div className="dashboard">
      <div className="dashboard-fixed">
        <div className="header">
          <a
            href={`https://github.com/${user.login}`}
            onClick={(e) => {
              e.preventDefault();
              openOrFocusTab(`https://github.com/${user.login}`);
            }}
            className="header-profile"
          >
            <img src={user.avatar_url} alt={user.login} className="avatar" />
            <span className="header-username">{user.login}</span>
          </a>
          <div className="header-actions">
            <button onClick={() => onReload(tab)} className="reload-btn" disabled={isLoadingPRs} title="Reload">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.001 7.001 0 0 1 15 8a1 1 0 1 1-2 0 5 5 0 0 0-5-5.5ZM1 8a1 1 0 0 1 2 0 5 5 0 0 0 5 5.5 5.487 5.487 0 0 0 4.131-1.869l-1.204-1.204A.25.25 0 0 1 11.104 10h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.001 7.001 0 0 1 1 8Z"/>
              </svg>
            </button>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="tab-bar">
          {(["assigned", "reviews", "merged"] as Tab[]).map((tabKey) => {
            const count =
              tabKey === "assigned" ? assigned.length
              : tabKey === "reviews" ? reviews.length
              : merged.length;
            const name =
              tabKey === "assigned" ? "My PRs"
              : tabKey === "reviews" ? "Reviews"
              : "Merged";
            const label = count > 0 ? `${name} (${count})` : name;
            return (
              <button
                key={tabKey}
                onClick={() => { setTab(tabKey); onTabChange(tabKey); }}
                className={`tab-button${tab === tabKey ? " tab-button--active" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dashboard-scroll">
        {isLoadingPRs ? (
          <PRListSkeleton />
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : tab === "assigned" ? (
          <PRList
            prs={assigned}
            emptyMessage="No open PRs assigned to you."
            showChecks
            showBaseBranch
          />
        ) : tab === "reviews" ? (
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
        ) : (
          <PRList
            prs={merged}
            emptyMessage="No PRs merged in the last week."
            showMergedBadge
            showBaseBranch
          />
        )}
      </div>
    </div>
  );
}
