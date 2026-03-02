import { useState } from 'react';
import Navbar from './components/Navbar';
import TimeWindowSelector from './components/TimeWindowSelector';
import CategoryTabs from './components/CategoryTabs';
import ArticleCard from './components/ArticleCard';
import RefreshIndicator from './components/RefreshIndicator';
import { useArticles } from './hooks/useArticles';

export default function App() {
  const [timeWindow, setTimeWindow] = useState('24h');
  const [category, setCategory] = useState('all');
  const { articles, loading, lastUpdated, refresh } = useArticles(timeWindow, category);

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <div className="page">
          <div className="page-header">
            <h1 className="page-title">Trending Now</h1>
            <RefreshIndicator
              lastUpdated={lastUpdated}
              loading={loading}
              onRefresh={refresh}
            />
          </div>
          <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          <CategoryTabs value={category} onChange={setCategory} />
          <div className="article-list">
            {loading && articles.length === 0 ? (
              <div className="loading-state">Loading trending articles...</div>
            ) : articles.length === 0 ? (
              <div className="empty-state">
                No trending articles found for this time window. Data populates within a few minutes of starting the server.
              </div>
            ) : (
              articles.map((article, i) => (
                <ArticleCard key={article.url} article={article} rank={i + 1} />
              ))
            )}
          </div>
        </div>
      </main>
      <footer className="footer">
        <span>Trending News Aggregator</span>
        <span>Bluesky + Reddit + Hacker News</span>
      </footer>
    </div>
  );
}
