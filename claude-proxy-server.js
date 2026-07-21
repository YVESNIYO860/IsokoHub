const http = require('http');
const https = require('https');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const PORT = process.env.PORT || 3001;
const TARGET_HOST = 'api.anthropic.com';
const TARGET_PATH = '/v1/complete';

if (!CLAUDE_API_KEY) {
  console.error('ERROR: No Claude API key available. Set CLAUDE_API_KEY in the environment before starting the proxy. Example: set CLAUDE_API_KEY=your_key && node claude-proxy-server.js');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      message: 'Claude proxy is running. Send POST requests to /claude from your web app.'
    }));
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.url === '/claude' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      message: 'POST requests only. Send a POST to /claude with the Claude request payload.'
    }));
  }

  if (req.url !== '/claude' || req.method !== 'POST') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    }

    const requestData = JSON.stringify(payload);
    const proxyReq = https.request(
      {
        hostname: TARGET_HOST,
        path: TARGET_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData),
          'x-api-key': CLAUDE_API_KEY
        }
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
        });

        proxyRes.on('data', (chunk) => res.write(chunk));
        proxyRes.on('end', () => res.end());
      }
    );

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy failure', details: err.message }));
    });

    proxyReq.write(requestData);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`Claude proxy server listening on http://127.0.0.1:${PORT}`);
});
