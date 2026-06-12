// ============================================
// TAJ MOD - VERCEL OPTIMIZED FULL STACK
// ============================================
// api/lobby-list.js - Serverless API Endpoint
// ============================================

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Cache headers (5 seconds Vercel CDN + 30 seconds browser)
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
    res.setHeader('CDN-Cache-Control', 'max-age=5');
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=5');
    
    try {
        // Fetch from original API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://cs.mistaken.pl/lobbylist.php?format=json&version=2&minimal=1', {
            signal: controller.signal,
            headers: {
                'User-Agent': 'TajMod-Vercel-Proxy/1.0'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and optimize response
        const optimizedData = {
            servers: (data.servers || []).map(server => ({
                id: server.serverId,
                accountId: server.accountId,
                name: decodeServerName(server.info),
                rawName: server.info,
                players: server.players || 0,
                maxPlayers: server.maxPlayers || 64,
                map: server.map || 'Unknown',
                region: server.region || 'EU',
                official: server.officialCode !== 0,
                officialCode: server.officialCode || 0,
                friendlyFire: server.friendlyFire || false,
                whitelist: server.whitelist || false,
                version: server.version || '1.0.3',
                country: server.country || null
            })),
            total: {
                players: (data.servers || []).reduce((sum, s) => sum + (s.players || 0), 0),
                servers: (data.servers || []).length,
                full: (data.servers || []).filter(s => (s.players || 0) >= (s.maxPlayers || 64) * 0.9).length
            },
            timestamp: Date.now(),
            cached: true
        };
        
        return res.status(200).json(optimizedData);
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Return cached error response
        return res.status(503).json({
            error: 'Service temporarily unavailable',
            timestamp: Date.now(),
            servers: []
        });
    }
}

// Base64 decode helper
function decodeServerName(encoded) {
    if (!encoded) return 'Taj Mod Server';
    try {
        let decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        // Remove rich text tags
        decoded = decoded.replace(/<[^>]*>/g, '');
        return decoded.trim() || 'Taj Mod Server';
    } catch {
        return 'Taj Mod Server';
    }
}
