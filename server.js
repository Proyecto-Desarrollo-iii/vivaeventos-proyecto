const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;

const JWT_SECRET = process.env.JWT_SECRET || 'dGhpc0lzQVZlcnlTZWNyZXRLZXlGb3JWYWlhRXZlbnRvc1RoYXROZWVkczUw';

const SERVICES = {
    auth: 'http://localhost:8083',
    events: 'http://localhost:8081',
    tickets: 'http://localhost:8082',
    orders: 'http://localhost:8084',
    payments: 'http://localhost:8085',
    checkin: 'http://localhost:8086',
    notifications: 'http://localhost:8087',
    analytics: 'http://localhost:8088',
    audit: 'http://localhost:8089',
};

const PUBLIC_PATHS = ['/api/v1/auth/login', '/api/v1/auth/registro', '/api/v1/auth/validar-email', '/api/v1/auth/ping'];

function validateJwt(req, res, next) {
    const fullPath = req.originalUrl;

    if (PUBLIC_PATHS.some(p => fullPath.startsWith(p))) {
        return next();
    }

    const authHeader = req.headers.authorization;
    console.log('[validateJwt] path:', fullPath, 'hasAuthHeader:', !!authHeader, 'startsWithBearer:', authHeader ? authHeader.startsWith('Bearer ') : false);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    const secretKey = Buffer.from(JWT_SECRET, 'base64');
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, secretKey);
        console.log('[validateJwt] JWT valido, user:', decoded.sub);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('[validateJwt] JWT invalido:', err.message);
        return res.status(401).json({ error: 'Token invalido o expirado' });
    }
}

app.use((req, res, next) => {
    console.log('[Request]', req.method, req.url);
    next();
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

function createApiProxy(targetService) {
    return createProxyMiddleware({
        target: targetService,
        changeOrigin: true,
        secure: false,
        onError: (err, req, res) => {
            console.error('[Proxy Error]', err.message);
            res.status(502).json({ error: 'Servicio no disponible' });
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log('[Proxy]', req.method, req.url, '->', targetService + req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log('[Proxy Response]', proxyRes.statusCode, req.method, req.url);
        },
    });
}

app.use('/api/v1/auth', validateJwt, createApiProxy(SERVICES.auth));
app.use('/api/v1/events', validateJwt, createApiProxy(SERVICES.events));
app.use('/api/v1/tickets', validateJwt, createApiProxy(SERVICES.tickets));
app.use('/api/v1/orders', validateJwt, createApiProxy(SERVICES.orders));
app.use('/api/v1/payments', validateJwt, createApiProxy(SERVICES.payments));
app.use('/api/v1/checkin', validateJwt, createApiProxy(SERVICES.checkin));
app.use('/api/v1/notifications', validateJwt, createApiProxy(SERVICES.notifications));
app.use('/api/v1/analytics', validateJwt, createApiProxy(SERVICES.analytics));
app.use('/api/v1/audit', validateJwt, createApiProxy(SERVICES.audit));

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
    console.log('  Frontend:       http://localhost:' + PORT);
    console.log('  Auth:           ' + SERVICES.auth);
    console.log('  Events:         ' + SERVICES.events);
    console.log('  Tickets:        ' + SERVICES.tickets);
    console.log('  Orders:         ' + SERVICES.orders);
    console.log('  Payments:       ' + SERVICES.payments);
    console.log('  Check-in:       ' + SERVICES.checkin);
    console.log('  Notifications:  ' + SERVICES.notifications);
    console.log('  Analytics:      ' + SERVICES.analytics);
    console.log('  Audit:          ' + SERVICES.audit);
    console.log('==========================================\n');
});