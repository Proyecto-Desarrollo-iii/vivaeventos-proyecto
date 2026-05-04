const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;

const AUTH_SERVICE = 'http://localhost:8083';

app.use((req, res, next) => {
    console.log('[Request]', req.method, req.url, 'Headers:', JSON.stringify(req.headers));
    next();
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

// http-proxy-middleware - keep /api prefix
app.use('/api', createProxyMiddleware({
  target: AUTH_SERVICE,
  changeOrigin: true,
  secure: false,
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.status(502).json({ error: 'Auth service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('[Proxy Request]', req.method, req.url, '->', AUTH_SERVICE + req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('[Proxy Response]', proxyRes.statusCode, req.method, req.url);
  }
}));

app.get('/auth/:page', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth', req.params.page));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, req.path));
});

app.listen(PORT, () => {
  console.log('\n==========================================\n           VivaEventos Frontend Server                   \n==========================================\n  Frontend: http://localhost:' + PORT + '\n  Auth API: http://localhost:' + PORT + '/api/*\n  Target:  ' + AUTH_SERVICE + '\n==========================================\n');
});