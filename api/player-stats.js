// ============================================
// api/player-stats.js - Player Statistics Aggregator
// ============================================

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    
    try {
        const response = await fetch('https://cs.mistaken.pl/lobbylist.php?format=json&version=2&minimal=1');
        const data = await response.json();
        
        const servers = data.servers || [];
        
        // Calculate statistics
        const stats = {
            totalPlayers: servers.reduce((sum, s) => sum + (s.players || 0), 0),
            totalServers: servers.length,
            averagePlayers: Math.round(servers.reduce((sum, s) => sum + (s.players || 0), 0) / (servers.length || 1)),
            peakToday: 0, // Would need historical data
            mostPopularMap: getMostPopularMap(servers),
            regionDistribution: getRegionDistribution(servers),
            officialVsCommunity: {
                official: servers.filter(s => s.officialCode !== 0).length,
                community: servers.filter(s => s.officialCode === 0).length
            }
        };
        
        return res.status(200).json(stats);
        
    } catch (error) {
        return res.status(503).json({ error: 'Stats unavailable' });
    }
}

function getMostPopularMap(servers) {
    const mapCount = {};
    servers.forEach(s => {
        const map = s.map || 'Unknown';
        mapCount[map] = (mapCount[map] || 0) + 1;
    });
    return Object.entries(mapCount).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';
}

function getRegionDistribution(servers) {
    const regions = {};
    servers.forEach(s => {
        const region = s.region || 'EU';
        regions[region] = (regions[region] || 0) + 1;
    });
    return regions;
}
