import SourceBadge from './SourceBadge';
import { timeAgo } from '../utils/timeAgo';

const CATEGORY_COLORS = {
  tech: 'var(--cat-tech)',
  finance: 'var(--cat-finance)',
  general: 'var(--cat-general)',
};

export default function ArticleCard({ article, rank }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="article-card"
    >
      <div className="article-meta">
        <span className="article-rank">#{rank}</span>
        <span
          className="article-category"
          style={{ background: CATEGORY_COLORS[article.category] }}
        >
          {article.category}
        </span>
        <span className="article-time">{timeAgo(article.firstSeen)}</span>
      </div>
      <h2 className="article-title">{article.title || article.domain}</h2>
      <div className="article-footer">
        <span className="article-domain">{article.domain}</span>
        <div className="article-sources">
          <SourceBadge source="hackerNews" count={article.sources.hackerNews.count} />
          <SourceBadge source="reddit" count={article.sources.reddit.count} />
          <SourceBadge source="bluesky" count={article.sources.bluesky.count} />
        </div>
        <span className="article-total-mentions">
          {article.totalMentions} {article.totalMentions === 1 ? 'share' : 'shares'}
        </span>
      </div>
    </a>
  );
}
