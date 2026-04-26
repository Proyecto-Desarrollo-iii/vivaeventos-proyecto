const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;

const AUTH_SERVICE = 'http://localhost:8083';

app.use((req, res, next) => {
    console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
    next();
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.options('/api/*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '3600');
    res.sendStatus(200);
});

// http-proxy-middleware - keep /api prefix
app.use('/api', createProxyMiddleware({
  target: AUTH_SERVICE,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.status(502).json({ error: 'Auth service unavailable' });
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