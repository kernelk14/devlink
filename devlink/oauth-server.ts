import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  
  console.log(`[oauth-server] ${req.method} ${url.pathname}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (url.pathname === '/github/device-code' && req.method === 'POST') {
      const body = await readBody(req);
      console.log('[oauth-server] Requesting GitHub device code...');
      
      // For development without real GitHub OAuth, return mock device code
      if (!GITHUB_CLIENT_SECRET) {
        console.log('[oauth-server] Using mock device code (no client secret)');
        const mockDeviceCode = 'mock_device_code_' + Date.now();
        const mockUserCode = 'ABCD-1234';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          device_code: mockDeviceCode,
          user_code: mockUserCode,
          verification_uri: 'https://github.com/login/device',
          expires_in: 900,
          interval: 5,
        }));
        return;
      }
      
      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID || 'Iv23liAqm1Wj3CWPj7QX',
        scope: 'user:email',
      });

      try {
        const response = await fetch('https://github.com/login/device/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: params.toString(),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          console.error('[oauth-server] GitHub API error:', response.status, response.statusText);
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'GitHub API error', status: response.status }));
          return;
        }

        const data = await response.json();
        console.log('[oauth-server] GitHub response:', data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      } catch (fetchError) {
        console.error('[oauth-server] Fetch error:', fetchError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to connect to GitHub', details: String(fetchError) }));
        return;
      }
    }

    if (url.pathname === '/github/token' && req.method === 'POST') {
      const body = await readBody(req);
      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID || 'Iv23liAqm1Wj3CWPj7QX',
        client_secret: GITHUB_CLIENT_SECRET,
        ...JSON.parse(body || '{}'),
      });

      // If no client secret is set, return a mock token for development
      if (!GITHUB_CLIENT_SECRET) {
        const mockResponse = {
          access_token: 'mock_access_token',
          token_type: 'bearer',
          scope: 'user:email',
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockResponse));
        return;
      }

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: params.toString(),
      });

      const data = await response.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (url.pathname === '/github/user' && req.method === 'GET') {
      const auth = url.searchParams.get('token');
      if (!auth) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token' }));
        return;
      }

      // Return mock user for development
      if (auth === 'mock_access_token' || !GITHUB_CLIENT_SECRET) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          login: 'devuser',
          id: 12345,
          avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          name: 'Dev User',
          email: 'dev@example.com',
        }));
        return;
      }

      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${auth}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevLink/1.0',
        },
      });

      const data = await response.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (url.pathname === '/github/emails' && req.method === 'GET') {
      const auth = url.searchParams.get('token');
      if (!auth) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token' }));
        return;
      }

      // Return mock emails for development
      if (auth === 'mock_access_token' || !GITHUB_CLIENT_SECRET) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
          { email: 'dev@example.com', primary: true, verified: true }
        ]));
        return;
      }

      const response = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${auth}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevLink/1.0',
        },
      });

      const data = await response.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Array.isArray(data) ? data : []));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('[oauth-server]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

server.listen(PORT, () => {
  console.log(`[oauth-server] running on http://localhost:${PORT}`);
  if (!GITHUB_CLIENT_ID) {
    console.warn('[oauth-server] WARNING: GITHUB_CLIENT_ID not set. GitHub OAuth will use dev placeholder ID.');
  }
  if (!GITHUB_CLIENT_SECRET) {
    console.warn('[oauth-server] WARNING: GITHUB_CLIENT_SECRET not set. GitHub OAuth will fail unless using device flow without secret.');
  }
});