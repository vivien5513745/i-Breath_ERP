// i-Breath_ERP backend
// A minimal key-value storage API (mirrors the get/set/delete/list shape of
// Claude's artifact `window.storage`) backed by PostgreSQL, plus static
// hosting for the frontend in /public.

const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json({ limit: '10mb' })); // receipts are base64-encoded, allow generous body size
app.use(express.static(path.join(__dirname, 'public')));

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URI;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL (or POSTGRES_URI) environment variable is not set.');
  console.error('Add a PostgreSQL service in Zeabur and connect its connection string to this service.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// ---- API ----

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'error', message: e.message });
  }
});

// List keys, optionally filtered by prefix: GET /api/storage?prefix=attach:
app.get('/api/storage', async (req, res) => {
  try {
    const prefix = typeof req.query.prefix === 'string' ? req.query.prefix : '';
    const { rows } = await pool.query(
      'SELECT key FROM kv_store WHERE key LIKE $1 ORDER BY key',
      [prefix + '%']
    );
    res.json({ keys: rows.map(r => r.key) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Get a single value: GET /api/storage/:key
app.get('/api/storage/:key', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM kv_store WHERE key = $1',
      [req.params.key]
    );
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Upsert a value: PUT /api/storage/:key  body: { value: string }
app.put('/api/storage/:key', async (req, res) => {
  try {
    const value = req.body && typeof req.body.value === 'string' ? req.body.value : '';
    await pool.query(
      `INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [req.params.key, value]
    );
    res.json({ key: req.params.key, value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Delete a value: DELETE /api/storage/:key
app.delete('/api/storage/:key', async (req, res) => {
  try {
    await pool.query('DELETE FROM kv_store WHERE key = $1', [req.params.key]);
    res.json({ key: req.params.key, deleted: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

const port = process.env.PORT || 8080;

initDb()
  .then(() => {
    app.listen(port, () => console.log('i-Breath_ERP server listening on port ' + port));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
