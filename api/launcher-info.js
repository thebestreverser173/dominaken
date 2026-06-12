// ============================================
// api/launcher-info.js - Launcher Version Check
// ============================================

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    
    try {
        const response = await fetch('https://s3.mistaken.pl/taj-mod/launcher/latest.json', {
            headers: { 'User-Agent': 'TajMod-Vercel/1.0' }
        });
        
        if (!response.ok) throw new Error('Launcher info unavailable');
        
        const data = await response.json();
        
        // Optimize response size
        const optimized = {
            version: data.version || '1.0.3',
            platforms: {
                windows: data.platforms?.['windows-x86_64'] ? {
                    url: data.platforms['windows-x86_64'].url,
                    size: data.platforms['windows-x86_64'].size,
                    hash: data.platforms['windows-x86_64'].hash?.substring(0, 16)
                } : null
            },
            changelog: data.changelog?.substring(0, 500),
            releaseDate: data.releaseDate || null
        };
        
        return res.status(200).json(optimized);
        
    } catch (error) {
        return res.status(503).json({ error: 'Service unavailable', version: '1.0.3' });
    }
}
