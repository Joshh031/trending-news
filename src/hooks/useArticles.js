import { useState, useEffect, useCallback } from 'react';

export function useArticles(timeWindow = '24h', category = 'all') {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles?window=${timeWindow}&category=${category}&limit=50`);
      const data = await res.json();
      setArticles(data.articles);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  }, [timeWindow, category]);

  useEffect(() => {
    setLoading(true);
    fetchArticles();
    const interval = setInterval(fetchArticles, 60000);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  return { articles, loading, lastUpdated, refresh: fetchArticles };
}
