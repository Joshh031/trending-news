import { loadSourceArticles, saveSourceArticles, addArticleToSource, evictStale } from '../../lib/articleStore.js';
import { extractUrlsFromText } from '../../lib/linkExtractor.js';

const BSKY_PUBLIC = 'https://public.api.bsky.app/xrpc';

function extractLinksFromPost(post) {
  const urls = [];
  const embed = post.embed;
  if (embed?.$type === 'app.bsky.embed.external#view' && embed?.external?.uri) {
    urls.push({ url: embed.external.uri, title: embed.external.title || '' });
  }
  if (embed?.$type === 'app.bsky.embed.recordWithMedia#view' && embed?.media?.external?.uri) {
    urls.push({ url: embed.media.external.uri, title: embed.media.external.title || '' });
  }
  const record = post.record;
  if (record?.facets) {
    for (const facet of record.facets) {
      for (const feature of facet.features || []) {
        if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
          urls.push({ url: feature.uri, title: '' });
        }
      }
    }
  }
  if (urls.length === 0 && record?.text) {
    for (const url of extractUrlsFromText(record.text)) {
      urls.push({ url, title: '' });
    }
  }
  return urls;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.POLL_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const existing = await loadSourceArticles('bluesky');
    let totalAdded = 0;

    const queries = ['news', 'breaking', 'article', 'report'];
    for (const q of queries) {
      try {
        const searchRes = await fetch(
          `${BSKY_PUBLIC}/app.bsky.feed.searchPosts?q=${q}&sort=top&limit=50`
        );
        if (!searchRes.ok) continue;
        const data = await searchRes.json();
        for (const postView of data.posts || []) {
          const links = extractLinksFromPost(postView);
          for (const { url, title } of links) {
            const result = addArticleToSource(existing, url, title, 'bluesky', {
              postUri: postView.uri,
              sourceHint: 'bluesky',
            });
            if (result) totalAdded++;
          }
        }
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }

    try {
      const trendsRes = await fetch(`${BSKY_PUBLIC}/app.bsky.unspecced.getTrends?limit=10`);
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        for (const trend of trendsData.trends || trendsData.topics || []) {
          const topic = trend.topic || trend.tag || '';
          if (!topic) continue;
          try {
            const searchRes = await fetch(
              `${BSKY_PUBLIC}/app.bsky.feed.searchPosts?q=${encodeURIComponent(topic)}&sort=top&limit=25`
            );
            if (!searchRes.ok) continue;
            const searchData = await searchRes.json();
            for (const postView of searchData.posts || []) {
              const links = extractLinksFromPost(postView);
              for (const { url, title } of links) {
                const result = addArticleToSource(existing, url, title, 'bluesky', {
                  postUri: postView.uri,
                  sourceHint: 'bluesky',
                });
                if (result) totalAdded++;
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch {}

    evictStale(existing);
    await saveSourceArticles('bluesky', existing);

    res.status(200).json({ source: 'bluesky', added: totalAdded });
  } catch (err) {
    console.error('[Bluesky Poll] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
