let getMergedArticles;
let importError = null;

try {
  const mod = await import('../lib/articleStore.js');
  getMergedArticles = mod.getMergedArticles;
} catch (err) {
  importError = err;
}

export default async function handler(req, res) {
  if (importError) {
    console.error('[API] Import error:', importError);
    return res.status(500).json({ error: 'Module import failed', details: importError.message, stack: importError.stack });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { window = '24h', category = 'all', limit = '50' } = req.query;
    const articles = await getMergedArticles({
      window,
      category,
      limit: Math.min(parseInt(limit) || 50, 200),
    });

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.status(200).json({
      articles,
      meta: {
        window,
        category,
        count: articles.length,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    console.error('[API] Error fetching articles:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
