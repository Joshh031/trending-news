export default async function handler(req, res) {
  res.status(200).json({ ok: true, time: Date.now(), env: {
    hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    hasPollSecret: !!process.env.POLL_SECRET,
    nodeVersion: process.version,
  }});
}
