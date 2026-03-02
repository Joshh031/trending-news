import { Redis } from '@upstash/redis';

// Strip stray quotes from env vars (common copy-paste issue)
const clean = (s) => (s || '').replace(/^["']+|["']+$/g, '').trim();

const redis = new Redis({
  url: clean(process.env.UPSTASH_REDIS_REST_URL),
  token: clean(process.env.UPSTASH_REDIS_REST_TOKEN),
});

export default redis;
