const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;
const GATEWAY = 'http://localhost:8080';

app.use((req, res, next) => {
    console.log('[Request]', req.method, req.url);
    next();
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

const apiProxy = createProxyMiddleware({
    target: GATEWAY,
    changeOrigin: true,
    secure: false,
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
        res.status(502).json({ error: 'Gateway no disponible' });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy]', req.method, req.url, '->', GATEWAY + req.url);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Response]', proxyRes.statusCode, req.method, req.url);
    },
});

app.use('/api/v1', apiProxy);

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
    console.log('\n==========================================');
    console.log('           VivaEventos Frontend');
    console.log('==========================================');
    console.log('  Frontend:    http://localhost:' + PORT);
    console.log('  Gateway:     ' + GATEWAY);
    console.log('==========================================\n');
});