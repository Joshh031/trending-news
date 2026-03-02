export default async function handler(req, res) {
  const clean = (s) => (s || '').replace(/^["']+|["']+$/g, '').trim();

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const cleanedUrl = clean(rawUrl);
  const cleanedToken = clean(rawToken);

  res.status(200).json({
    rawUrl: { length: rawUrl.length, first5: rawUrl.substring(0, 5), last5: rawUrl.substring(rawUrl.length - 5), startsWithQuote: rawUrl.startsWith('"'), endsWithQuote: rawUrl.endsWith('"') },
    rawToken: { length: rawToken.length, first5: rawToken.substring(0, 5), last5: rawToken.substring(rawToken.length - 5), startsWithQuote: rawToken.startsWith('"'), endsWithQuote: rawToken.endsWith('"') },
    cleanedUrl: { length: cleanedUrl.length, value: cleanedUrl },
    cleanedToken: { length: cleanedToken.length, first10: cleanedToken.substring(0, 10) + '...' },
  });
}
