import { useState } from "react";
import { getRepoName } from "../github";
import { openOrFocusTab } from "../tabs";
import type { PullRequestItem, ReviewStatus } from "../types";

const PAGE_SIZE = 10;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const reviewLabels: Record<ReviewStatus, string> = {
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  COMMENTED: "Commented",
  PENDING: "Pending review",
};

const reviewCssClass: Record<ReviewStatus, string> = {
  APPROVED: "review-badge--approved",
  CHANGES_REQUESTED: "review-badge--changes",
  COMMENTED: "review-badge--commented",
  PENDING: "review-badge--pending",
};

interface PRListProps {
  prs: PullRequestItem[];
  emptyMessage: string;
  showAuthor?: boolean;
  showChecks?: boolean;
  showMyReview?: boolean;
  showMergedBadge?: boolean;
  showBaseBranch?: boolean;
}

export default function PRList({ prs, emptyMessage, showAuthor, showChecks, showMyReview, showMergedBadge, showBaseBranch }: PRListProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (prs.length === 0) {
    return <p className="muted-text">{emptyMessage}</p>;
  }

  const visiblePRs = prs.slice(0, visible);
  const remainingCount = prs.length - visible;

  return (
    <>
      <ul className="pr-list">
        {visiblePRs.map((pr) => (
          <li key={pr.id} className={`pr-item${showChecks || showMergedBadge ? " pr-item--with-check" : ""}`}>
            <div className="pr-item-content">
              <a
                href={pr.html_url}
                onClick={(e) => {
                  e.preventDefault();
                  openOrFocusTab(pr.html_url);
                }}
                className="link"
              >
                {pr.title}
              </a>
              {showBaseBranch ? (
                <>
                  <div className="pr-meta">
                    <span className="pr-repo">{getRepoName(pr.repository_url)}</span>
                    {pr.base_ref && (
                      <span className="pr-base-ref">{pr.base_ref}</span>
                    )}
                  </div>
                  <div className="pr-meta">
                    {pr.created_at && (
                      <span className="pr-date">{timeAgo(pr.created_at)}</span>
                    )}
                    {showChecks && (
                      <>
                        {(pr.comments ?? 0) > 0 && (
                          <span className="pr-stat" title="Comments">
                            💬 {pr.comments}
                          </span>
                        )}
                        {(pr.approvals ?? 0) > 0 && (
                          <span className="pr-stat pr-stat--success" title="Approvals">
                            ✓ {pr.approvals}
                          </span>
                        )}
                        {(pr.changes_requested ?? 0) > 0 && (
                          <span className="pr-stat pr-stat--danger" title="Changes requested">
                            ✗ {pr.changes_requested}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="pr-meta">
                  <span className="pr-repo">{getRepoName(pr.repository_url)}</span>
                  {pr.created_at && (
                    <span className="pr-date">{timeAgo(pr.created_at)}</span>
                  )}
                </div>
              )}
              {showAuthor && (
                <div className="pr-meta-row">
                  {pr.user && (
                    <span className="pr-author">
                      <img src={pr.user.avatar_url} alt={pr.user.login} className="pr-author-avatar" />
                      {pr.user.login}
                    </span>
                  )}
                  {showMyReview && pr.my_review_status && (
                    <span className={`review-badge ${reviewCssClass[pr.my_review_status]}`}>
                      {reviewLabels[pr.my_review_status]}
                    </span>
                  )}
                </div>
              )}
            </div>
            {showChecks && pr.check_status && (
              <span
                className={`check-badge check-badge--${pr.check_status}`}
                title={pr.check_status}
              >
                {pr.check_status === "success" ? "\u2713" : pr.check_status === "failure" ? "\u2717" : "\u25CF"}
              </span>
            )}
            {showMergedBadge && (
              <span className="check-badge check-badge--merged" title="Merged">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8-8a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 4a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ul>
      {remainingCount > 0 && (
        <button
          className="btn-show-more"
          onClick={() => setVisible((prev) => prev + PAGE_SIZE)}
        >
          Show more ({remainingCount} remaining)
        </button>
      )}
    </>
  );
}
