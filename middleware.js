// ============================================
// middleware.js - Global Rate Limiting & Security
// ============================================

import { rateLimit } from '@vercel/edge';

export const config = {
    matcher: '/api/:path*',
};

export default rateLimit({
    interval: 60000, // 1 minute
    limit: 30, // 30 requests per minute per IP
    rateLimitHeader: true,
    generateKey: (req) => req.ip ?? req.headers.get('x-forwarded-for') ?? 'anonymous',
    onLimitReached: () => new Response('Rate limit exceeded', { status: 429 })
});
