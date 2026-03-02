import { loadSourceArticles, saveSourceArticles, addArticleToSource, evictStale } from '../../lib/articleStore.js';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.POLL_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const existing = await loadSourceArticles('hackerNews');

    const topRes = await fetch(`${HN_BASE}/topstories.json`);
    const ids = await topRes.json();
    const topIds = ids.slice(0, 200);

    let added = 0;
    for (let i = 0; i < topIds.length; i += 10) {
      const batch = topIds.slice(i, i + 10);
      const items = await Promise.all(
        batch.map(id =>
          fetch(`${HN_BASE}/item/${id}.json`)
            .then(r => r.json())
            .catch(() => null)
        )
      );
      for (const item of items) {
        if (!item || !item.url || item.type !== 'story') continue;
        const result = addArticleToSource(existing, item.url, item.title, 'hackerNews', {
          score: item.score,
          itemId: item.id,
          sourceHint: 'hackernews',
        });
        if (result) added++;
      }
    }

    evictStale(existing);
    await saveSourceArticles('hackerNews', existing);

    res.status(200).json({ source: 'hackerNews', processed: topIds.length, added });
  } catch (err) {
    console.error('[HN Poll] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
