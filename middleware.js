// ============================================
// middleware.js - FIXED (No external dependencies)
// ============================================

// Simple in-memory rate limiting for Edge
const ipRequestCounts = new Map();

export function middleware(request) {
    const url = new URL(request.url);
    
    // Only apply rate limiting to API routes
    if (!url.pathname.startsWith('/api/')) {
        return;
    }
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30; // 30 requests per minute
    
    // Get or create IP record
    let record = ipRequestCounts.get(ip);
    
    if (!record) {
        record = { count: 1, resetTime: now + windowMs };
        ipRequestCounts.set(ip, record);
        
        // Auto-cleanup after window expires
        setTimeout(() => {
            if (ipRequestCounts.get(ip)?.resetTime <= Date.now()) {
                ipRequestCounts.delete(ip);
            }
        }, windowMs);
    } else {
        // Check if window expired
        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
        } else {
            record.count++;
        }
        ipRequestCounts.set(ip, record);
    }
    
    // Check rate limit
    if (record.count > maxRequests) {
        return new Response(JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please wait before making more requests.',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
                'X-RateLimit-Limit': String(maxRequests),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(record.resetTime)
            }
        });
    }
    
    // Add rate limit headers to response
    const response = new Response(null, {
        status: 200,
        headers: {
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': String(maxRequests - record.count),
            'X-RateLimit-Reset': String(record.resetTime)
        }
    });
    
    return response;
}

export const config = {
    matcher: '/api/:path*',
};
