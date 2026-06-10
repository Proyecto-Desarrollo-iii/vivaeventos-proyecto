const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { createProxyMiddleware } = require('http-proxy-middleware');
const os = require('os');

const PORT = process.env.PORT || 5000;
const SSL_PORT = 5443;
const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:8090';

function getAllowedOrigins() {
    const configured = process.env.ALLOWED_ORIGINS;
    if (configured) {
        return configured.split(',').map((origin) => origin.trim()).filter(Boolean);
    }
    return [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
    ];
}

function isOriginAllowed(origin) {
    if (!origin) return false;
    return getAllowedOrigins().includes(origin);
}

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

function createPool(prefix) {
    const host = process.env[prefix + '_HOST'];
    if (!host) return null;
    return new Pool({
        host: host,
        port: parseInt(process.env[prefix + '_PORT'] || '5432'),
        database: process.env[prefix + '_DATABASE'],
        user: process.env[prefix + '_USER'],
        password: process.env[prefix + '_PASSWORD'],
    });
}

function createApp({ pool, checkinPool } = {}) {
    const ticketsPool = pool || createPool('DB_TICKETS') || new Pool({
        host: 'localhost',
        port: 5433,
        database: 'vivaeventos_tickets',
        user: 'devdb',
        password: 'a1b2c3d4',
    });
    const validationsPool = checkinPool || createPool('DB_CHECKIN') || new Pool({
        host: 'localhost',
        port: 5433,
        database: 'vivaeventos_checkin',
        user: 'devdb',
        password: 'a1b2c3d4',
    });

    const app = express();

    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (isOriginAllowed(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Vary', 'Origin');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.header('Access-Control-Expose-Headers', 'Content-Length');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        console.log('[Request]', req.method, req.url);
        next();
    });

    app.use('/assets', express.static(path.join(__dirname, 'assets')));

    const apiProxy = createProxyMiddleware({
        target: GATEWAY,
        changeOrigin: true,
        secure: GATEWAY.startsWith('https://'),
        onError: (err, req, res) => {
            console.error('[Proxy Error]', err.message);
            res.status(502).json({ error: 'Gateway no disponible' });
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log('[Proxy]', req.method, req.url, '->', GATEWAY + req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
            const origin = req && req.headers && req.headers.origin;
            if (isOriginAllowed(origin)) {
                proxyRes.headers['access-control-allow-origin'] = origin;
                proxyRes.headers['vary'] = 'Origin';
            }
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
                ticketsPool.query(ticketsSql, params),
                validationsPool.query(checkinSql, params),
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

    // ============================================
    // Servido de componentes estáticos del frontend
    // Solo se exponen las carpetas del frontend; nunca server.js,
    // package.json, node_modules ni cualquier otro archivo del backend.
    // ============================================
    const STATIC_DIRS = ['auth', 'admin', 'validator', 'shared'];
    STATIC_DIRS.forEach((dir) => {
        app.use('/' + dir, express.static(path.join(__dirname, dir)));
    });

    // Página de inicio
    app.get(['/', '/index.html'], (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Fallback de navegación:
    //  - Rutas de página (sin extensión o .html)  -> index.html
    //  - Cualquier otro archivo no encontrado o ruta /api desconocida -> 404 limpio
    app.use((req, res) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            const ext = path.extname(req.path);
            if (ext === '' || ext === '.html') {
                return res.sendFile(path.join(__dirname, 'index.html'));
            }
        }
        res.status(404).json({ error: 'Recurso no encontrado' });
    });

    return app;
}

function startServer(app = null) {
    const localIP = getLocalIP();
    const serverApp = app || createApp();

    if (process.env.SKIP_SERVER_START === 'true') {
        console.log('Skipping server listen because SKIP_SERVER_START is true');
        return serverApp;
    }

    serverApp.listen(PORT, '0.0.0.0', () => {
        console.log('\n==========================================');
        console.log('           VivaEventos Frontend');
        console.log('==========================================');
        console.log('  HTTP:        http://localhost:' + PORT);
        console.log('  HTTPS:       https://' + localIP + ':' + SSL_PORT);
        console.log('  Gateway:     ' + GATEWAY);
        console.log('==========================================\n');
    });
}

if (require.main === module) {
    startServer();
}

module.exports = {
    createApp,
    getLocalIP,
    createPool,
    startServer,
};

// HTTPS server disabled due to missing certificates
// https.createServer({
//     key: fs.readFileSync(path.join(__dirname, 'key.pem')),
//     cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
// }, createApp()).listen(SSL_PORT, '0.0.0.0');
