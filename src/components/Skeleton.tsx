export function DashboardSkeleton() {
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
      <PRListSkeleton />
    </div>
  );
}

export function PRListSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-pr-item">
          <div className="skeleton skeleton-line skeleton-line--medium" />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}
