const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { createProxyMiddleware } = require('http-proxy-middleware');
const os = require('os');

const app = express();
const PORT = 5000;
const SSL_PORT = 5443;

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();
const GATEWAY = 'http://localhost:8090';
const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vivaeventos_tickets',
    user: 'devdb',
    password: 'a1b2c3d4',
});
const checkinPool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'vivaeventos_checkin',
    user: 'devdb',
    password: 'a1b2c3d4',
});

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

app.get('/api/validations/today', async (req, res) => {
    try {
        const operator = req.query.operator || '';
        const ticketsSql = `SELECT v.id, v.qr_code, v.result,
                        v.validated_at AT TIME ZONE 'UTC' as validated_at,
                        v.gate_location, v.validated_by,
                        i.event_name, i.holder_name, i.ticket_type, i.holder_email
                     FROM ticket_validations v
                     LEFT JOIN issued_tickets i ON v.issued_ticket_id = i.id
                     WHERE v.validated_at >= CURRENT_DATE
                       AND ($1 = '' OR v.validated_by = $1)
                     ORDER BY v.validated_at DESC`;
        const checkinSql = `SELECT v.id, v.qr_code, v.result,
                        v.validated_at AT TIME ZONE 'UTC' as validated_at,
                        v.gate_location, v.validated_by,
                        NULL as event_name, NULL as holder_name, NULL as ticket_type, NULL as holder_email
                     FROM ticket_validations v
                     WHERE v.validated_at >= CURRENT_DATE
                       AND ($1 = '' OR v.validated_by = $1)
                     ORDER BY v.validated_at DESC`;
        const params = [operator];
        const [ticketsRes, checkinRes] = await Promise.allSettled([
            pool.query(ticketsSql, params),
            checkinPool.query(checkinSql, params),
        ]);
        let rows = [];
        if (ticketsRes.status === 'fulfilled') rows = rows.concat(ticketsRes.value.rows);
        if (checkinRes.status === 'fulfilled') rows = rows.concat(checkinRes.value.rows);
        rows.sort((a, b) => new Date(b.validated_at) - new Date(a.validated_at));
        res.json(rows);
    } catch (err) {
        console.error('[DB Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth', req.params.page));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n==========================================');
    console.log('           VivaEventos Frontend');
    console.log('==========================================');
    console.log('  HTTP:        http://localhost:' + PORT);
    console.log('  HTTPS:       https://' + LOCAL_IP + ':' + SSL_PORT);
    console.log('  Gateway:     ' + GATEWAY);
    console.log('==========================================\n');
});

https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
}, app).listen(SSL_PORT, '0.0.0.0');
