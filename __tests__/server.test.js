const request = require('supertest');
const os = require('os');
const { spawnSync } = require('child_process');

let proxyConfig;
const mockProxyMiddleware = jest.fn((config) => {
  proxyConfig = config;
  return (req, res, next) => next();
});

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: (config) => mockProxyMiddleware(config),
}));

const { createApp, getLocalIP, createPool, startServer } = require('../server');

const makeMockPool = () => ({
  query: jest.fn(),
});

describe('vivaeventos-proyecto server', () => {
  let pool;
  let app;

  beforeEach(() => {
    pool = makeMockPool();
    app = createApp({ pool, checkinPool: pool });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('serves index.html at root', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<!DOCTYPE html>/i);
  });

  test('serves index.html for frontend SPA fallback routes', async () => {
    const res = await request(app).get('/admin/custom-route');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<!DOCTYPE html>/i);
  });

  test('returns 404 for unknown api route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Recurso no encontrado' });
  });

  test('returns merged validations sorted by date', async () => {
    const now = new Date().toISOString();
    const earlier = new Date(Date.now() - 60000).toISOString();

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, validated_at: earlier }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, validated_at: now }] });

    const res = await request(app).get('/api/validations/today?operator=test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 2, validated_at: now },
      { id: 1, validated_at: earlier },
    ]);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query.mock.calls[0][1]).toEqual(['test']);
  });

  test('returns 500 when the query function throws synchronously', async () => {
    pool.query = jest.fn(() => {
      throw new Error('sync failure');
    });
    app = createApp({ pool, checkinPool: pool });

    const res = await request(app).get('/api/validations/today');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'sync failure' });
  });

  test('options requests return 204 directly from middleware', async () => {
    const res = await request(app).options('/api/validations/today');
    expect(res.status).toBe(204);
  });

  test('createPool returns a Pool instance when environment variables are set', async () => {
    process.env.DB_TEST_HOST = 'localhost';
    process.env.DB_TEST_PORT = '5432';
    process.env.DB_TEST_DATABASE = 'testdb';
    process.env.DB_TEST_USER = 'user';
    process.env.DB_TEST_PASSWORD = 'pass';

    const poolInstance = createPool('DB_TEST');
    expect(poolInstance).not.toBeNull();
    expect(poolInstance.options.host).toBe('localhost');
    expect(poolInstance.options.database).toBe('testdb');
    await poolInstance.end();
  });

  test('createPool returns null when environment variable host is missing', () => {
    delete process.env.DB_MISSING_HOST;
    const poolInstance = createPool('DB_MISSING');
    expect(poolInstance).toBeNull();
  });

  test('api validation merges only fulfilled results and skips rejected ones', async () => {
    const fulfilledPool = { query: jest.fn().mockResolvedValue({ rows: [{ id: 1, validated_at: '2025-01-01T00:00:00Z' }] }) };
    const rejectedPool = { query: jest.fn().mockRejectedValue(new Error('query failed')) };

    const appWithRejected = createApp({ pool: fulfilledPool, checkinPool: rejectedPool });
    const res = await request(appWithRejected).get('/api/validations/today');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, validated_at: '2025-01-01T00:00:00Z' }]);
  });

  test('proxy middleware is configured with gateway target and handlers', () => {
    expect(mockProxyMiddleware).toHaveBeenCalled();
    expect(proxyConfig).toBeDefined();
    expect(proxyConfig.target).toBe(process.env.GATEWAY_URL || 'http://localhost:8090');
    expect(typeof proxyConfig.onError).toBe('function');
    expect(typeof proxyConfig.onProxyReq).toBe('function');
    expect(typeof proxyConfig.onProxyRes).toBe('function');

    const req = { method: 'GET', url: '/test' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    proxyConfig.onError(new Error('boom'), req, res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ error: 'Gateway no disponible' });
    proxyConfig.onProxyReq({ removeHeader: jest.fn() }, req, res);
    proxyConfig.onProxyRes({ headers: {} }, req, res);
  });

  test('startServer uses app.listen without throwing', () => {
    const fakeApp = {
      listen: jest.fn((port, host, callback) => callback()),
    };

    expect(() => startServer(fakeApp)).not.toThrow();
    expect(fakeApp.listen).toHaveBeenCalledWith(5000, '0.0.0.0', expect.any(Function));
  });

  test('getLocalIP returns localhost when no external interface exists', () => {
    const originalNetworkInterfaces = jest.spyOn(os, 'networkInterfaces');
    originalNetworkInterfaces.mockReturnValue({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
    });

    expect(getLocalIP()).toBe('localhost');
    originalNetworkInterfaces.mockRestore();
  });

  test('getLocalIP returns a valid external IPv4 address when available', () => {
    const originalNetworkInterfaces = jest.spyOn(os, 'networkInterfaces');
    originalNetworkInterfaces.mockReturnValue({
      eth0: [{ family: 'IPv4', internal: false, address: '192.168.1.100' }],
    });

    expect(getLocalIP()).toBe('192.168.1.100');
    originalNetworkInterfaces.mockRestore();
  });

  test('running server.js directly executes the module main branch without listening when skipped', () => {
    const result = spawnSync('node', ['server.js'], {
      cwd: __dirname + '/..',
      env: { ...process.env, SKIP_SERVER_START: 'true' },
      encoding: 'utf8',
      timeout: 5000,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toMatch(/Skipping server listen because SKIP_SERVER_START is true/);
  });

  test('startServer logs console output with all details when listen callback is invoked', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const fakeApp = {
      listen: jest.fn((port, host, callback) => {
        callback();
      }),
    };

    startServer(fakeApp);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('VivaEventos Frontend')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('HTTP')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('HTTPS')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Gateway')
    );
    consoleSpy.mockRestore();
  });
});
