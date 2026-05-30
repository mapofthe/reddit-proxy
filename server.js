const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', usage: '/reddit?subreddit=NatureIsFuckingLit&sort=top&limit=10' });
});

app.get('/reddit', async (req, res) => {
  try {
    const { subreddit = 'NatureIsFuckingLit', sort = 'top', limit = 25, after = '' } = req.query;
    
    let url = `https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=${limit}&raw_json=1`;
    if (after) url += `&after=${after}`;
    
    console.log('Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Reddit error:', response.status, text);
      return res.status(response.status).json({ 
        error: `Reddit returned ${response.status}`,
        message: text.substring(0, 500)
      });
    }
    
    const data = await response.json();
    
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Reddit proxy running on port ${PORT}`);
});
