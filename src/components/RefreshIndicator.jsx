import { timeAgo } from '../utils/timeAgo';

export default function RefreshIndicator({ lastUpdated, loading, onRefresh }) {
  return (
    <div className="refresh-indicator">
      <span className="refresh-text">
        {loading ? 'Refreshing...' : lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : ''}
      </span>
      <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
        Refresh
      </button>
    </div>
  );
}
