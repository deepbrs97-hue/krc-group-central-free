require("dotenv").config();

const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Create a PostgreSQL database and set DATABASE_URL.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/i.test(DATABASE_URL) ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "Welcome";
const TZ = "Asia/Kolkata";

const defaultModules = [
  ["DOC PDF", "doc-pdf", "OPERATIONS", "📄", "https://script.google.com/a/macros/nrlpg.com/s/AKfycbwG75q8IFw4vXMHhvWWVuPWpjAKrzj791EG1P_-tyg6Pn5FBgZLYqaOThO5AAAI_mly/exec"],
  ["Bulk Doc", "bulk-doc", "OPERATIONS", "📄", "https://script.google.com/macros/s/AKfycbwXWs6Qhi3fNHep_XbOgRVtiIvejVz4HY7Juditm9ckbiQu8CtXvo55q5Sz5URKVl2g/exec"],
  ["Pack truck Doc", "pack-truck-doc", "OPERATIONS", "🚛", "https://script.google.com/macros/s/AKfycbx9-ZamkZodXFOZ-LT2Iph_IAIN-pDM9Q3JHK2x8vAFKfuxwXFXDFC06fXylSIAOnd4MA/exec"],
  ["Driver details", "driver-details", "OPERATIONS", "👨‍✈️", "https://script.google.com/macros/s/AKfycbzvLcA2o5W8PePqeikHtXw2wmSJ7fJSjPcfewOrYu2SpKD1fQ2LTH-uhSfgqu-Vnjyh-A/exec"],
  ["Bulk trips details", "bulk-trips-details", "OPERATIONS", "🚚", "https://script.google.com/macros/s/AKfycbzxk6PjoJSo8hggn0tIKGdWuvpP6IVWAF5BG_K51Tm_Isf7Gk5GGYdcLyrC-zgMAk2Ftw/exec"],
  ["Pack truck trips details", "pack-truck-trips-details", "OPERATIONS", "🚛", "https://script.google.com/macros/s/AKfycbwNjkFZJTxGO0IfEbp2iLhoGcKs4b8PlHpDhdSWp0oahTfWUPagUx-Yq_7x3u2CNsGMyQ/exec"],
  ["Trips details", "trips-details", "OPERATIONS", "📋", "https://script.google.com/macros/s/AKfycbwNjkFZJTxGO0IfEbp2iLhoGcKs4b8PlHpDhdSWp0oahTfWUPagUx-Yq_7x3u2CNsGMyQ/exec"],
  ["Leave", "leave", "MANAGEMENT", "📝", "https://script.google.com/a/macros/akd.org.in/s/AKfycbxsbWMufU7oXPeQ_fL1BPJNBhwZxnuVcZmIcaZriZJtSaq1gFj2Beq-Wbc82sOd4wzWQw/exec"],
  ["HR", "hr", "MANAGEMENT", "👥", "https://script.google.com/a/macros/nrlpg.com/s/AKfycbwFZqhJ7OL2LHXQZByKG0eSVzIKfEJqU0rdy6YjiQiNr6igXZzVmGAqzt-wO4oOm17pgQ/exec"],
  ["Indant", "indant", "MANAGEMENT", "📦", "https://script.google.com/a/macros/nrlpg.com/s/AKfycbxAeN5Y5NL-1iK7cjQU2VRhU9TAwiWqv0ysQI1zuyg2TjqiQspRR-fuGW_NirsKbRJY/exec"],
  ["Challan Details", "challan-details", "MANAGEMENT", "🧾", "https://script.google.com/a/macros/nrlpg.com/s/AKfycbyBXFeJ7EfMu0FlvDfV9vrTyXuIqo26X7AlYDu6Ssec_H3ML4VZMpdMXBukhnIw3m3zUQ/exec"],
  ["Payment", "payment", "MANAGEMENT", "💰", "https://docs.google.com/spreadsheets/d/1kTIOq8b8-9P9_uu6ZuqaTUg4Z6H2J6MYFHZObENaVSs/edit?gid=1336667463#gid=1336667463"],
  ["Breakdown details", "breakdown-details", "VEHICLE & SAFETY", "🔧", "https://script.google.com/macros/s/AKfycbxzFs--r7WKBbiMPNeLqDbQL8Op7KInxp9Qr2dPzlyyBrwtVsi71Z7pTpifHvyurDsS/exec"],
  ["Accident details", "accident-details", "VEHICLE & SAFETY", "⚠️", "https://script.google.com/a/macros/nrlpg.com/s/AKfycbzyhPwsLass7J-F_uxRR5K7ss7_VgHi5KQCHh1IHhgf40k1CrrwXclA-uwZAS2mq8Blvw/exec"],
  ["TYRE Management system", "tyre-management", "VEHICLE & SAFETY", "🛞", "https://script.google.com/a/macros/nrlpg.com/s/AKfycbwiPuUhfbxdwaLd07P_6dzZ2-hBmwNdxrKABnQ5JB6SQKhCKDtpmugODiqmclfFLZ9y/exec"],
  ["Angul DDR", "angul-ddr", "ANGUL", "📊", "https://docs.google.com/spreadsheets/d/1TINzWK_3ZMPAvQnprNG05kVusmNBuG7-2UwJJtvsV5s/edit?usp=sharing"]
];

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS modules (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'OTHER',
      icon TEXT NOT NULL DEFAULT '◈',
      url TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS permissions (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module_id BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, module_id)
    );
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGSERIAL PRIMARY KEY,
      admin_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const userCount = Number((await pool.query("SELECT COUNT(*) AS count FROM users")).rows[0].count);
  if (userCount === 0) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    await pool.query(
      "INSERT INTO users (username, password_hash, role, active) VALUES ($1, $2, 'admin', TRUE)",
      [adminUsername, hash]
    );
    console.log(`Central admin created: ${adminUsername}`);
  }

  const seeded = await pool.query("SELECT value FROM system_settings WHERE key = 'initial_modules_seeded'");
  if (seeded.rowCount === 0) {
    const moduleCount = Number((await pool.query("SELECT COUNT(*) AS count FROM modules")).rows[0].count);
    if (moduleCount === 0) {
      for (const module of defaultModules) {
        await pool.query(
          "INSERT INTO modules (name, slug, category, icon, url, active) VALUES ($1, $2, $3, $4, $5, TRUE) ON CONFLICT DO NOTHING",
          module
        );
      }
    }
    await pool.query("INSERT INTO system_settings (key, value) VALUES ('initial_modules_seeded', '1') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value");
  }
}

function q(text, params = []) { return pool.query(text, params); }

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", async (_req, res) => {
  try {
    await q("SELECT 1");
    res.json({ ok: true, service: "KRC GROUP", database: "PostgreSQL", timezone: TZ });
  } catch (err) {
    res.status(503).json({ ok: false, error: "Database unavailable.", timezone: TZ });
  }
});

const cloudApiUrl = String(process.env.KRC_CLOUD_API_URL || "").trim().replace(/\/$/, "");
if (cloudApiUrl) {
  console.log(`KRC GROUP cloud mode enabled: ${cloudApiUrl}`);
  app.use("/api", createProxyMiddleware({
    target: cloudApiUrl,
    changeOrigin: true,
    xfwd: true,
    cookieDomainRewrite: "",
    logLevel: "warn"
  }));
}

app.use(session({
  secret: process.env.SESSION_SECRET || "development-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") return res.status(401).json({ error: "Admin access required." });
  next();
}
async function getCurrentUser(req) {
  const r = await q("SELECT id, username, role, active FROM users WHERE id = $1", [req.session.user.id]);
  return r.rows[0] || null;
}
async function logAction(adminId, action, details = "") {
  await q("INSERT INTO activity_logs (admin_user_id, action, details) VALUES ($1, $2, $3)", [adminId, action, details]);
}

app.post("/api/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const r = await q("SELECT * FROM users WHERE username = $1", [username]);
    const user = r.rows[0];
    if (!user || !user.active || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "Invalid username or password." });
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ ok: true, user: req.session.user });
  } catch (err) { console.error(err); res.status(500).json({ error: "Login service unavailable." }); }
});

app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get("/api/me", async (req, res) => {
  try {
    if (!req.session.user) return res.json({ user: null });
    const user = await getCurrentUser(req);
    if (!user || !user.active) { req.session.destroy(() => {}); return res.json({ user: null }); }
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ error: "Session check failed." }); }
});

// ---------------- ADMIN ----------------
app.get("/api/dashboard", requireAdmin, async (req, res) => {
  try {
    const [users, activeUsers, modules, logs] = await Promise.all([
      q("SELECT COUNT(*) AS count FROM users"),
      q("SELECT COUNT(*) AS count FROM users WHERE active = TRUE"),
      q("SELECT COUNT(*) AS count FROM modules WHERE active = TRUE"),
      q(`SELECT a.action, a.details, a.created_at, u.username FROM activity_logs a LEFT JOIN users u ON u.id = a.admin_user_id ORDER BY a.id DESC LIMIT 8`)
    ]);
    res.json({ users: Number(users.rows[0].count), activeUsers: Number(activeUsers.rows[0].count), modules: Number(modules.rows[0].count), logs: logs.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Dashboard data unavailable." }); }
});

app.get("/api/users", requireAdmin, async (req, res) => {
  const r = await q("SELECT id, username, role, active, created_at FROM users ORDER BY id DESC");
  res.json({ users: r.rows });
});

app.post("/api/users", requireAdmin, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const role = req.body.role === "admin" ? "admin" : "user";
  if (!username || password.length < 6) return res.status(400).json({ error: "Username is required and password must be at least 6 characters." });
  try {
    const hash = bcrypt.hashSync(password, 12);
    const r = await q("INSERT INTO users (username, password_hash, role, active) VALUES ($1, $2, $3, TRUE) RETURNING id", [username, hash, role]);
    await logAction(req.session.user.id, "User created", `${username} (${role})`);
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) { res.status(409).json({ error: "Username already exists." }); }
});

app.patch("/api/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const found = await q("SELECT * FROM users WHERE id = $1", [id]);
  const user = found.rows[0];
  if (!user) return res.status(404).json({ error: "User not found." });
  const active = req.body.active === false ? false : true;
  const role = req.body.role === "admin" ? "admin" : "user";
  if (id === Number(req.session.user.id) && !active) return res.status(400).json({ error: "You cannot disable your own admin account." });
  await q("UPDATE users SET active = $1, role = $2 WHERE id = $3", [active, role, id]);
  await logAction(req.session.user.id, "User updated", `${user.username} → role=${role}, active=${active}`);
  res.json({ ok: true });
});

app.post("/api/users/:id/password", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const password = String(req.body.password || "");
  const found = await q("SELECT username FROM users WHERE id = $1", [id]);
  if (!found.rows[0]) return res.status(404).json({ error: "User not found." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
  const hash = bcrypt.hashSync(password, 12);
  await q("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, id]);
  await logAction(req.session.user.id, "Password changed", found.rows[0].username);
  res.json({ ok: true });
});

app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === Number(req.session.user.id)) return res.status(400).json({ error: "You cannot delete your own admin account." });
  const found = await q("SELECT username FROM users WHERE id = $1", [id]);
  if (!found.rows[0]) return res.status(404).json({ error: "User not found." });
  await q("DELETE FROM users WHERE id = $1", [id]);
  await logAction(req.session.user.id, "User deleted", found.rows[0].username);
  res.json({ ok: true });
});

app.post("/api/modules", requireAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const url = String(req.body.url || "").trim();
  const category = String(req.body.category || "OTHER").trim().toUpperCase() || "OTHER";
  const icon = String(req.body.icon || "◈").trim() || "◈";
  if (!name) return res.status(400).json({ error: "Module name is required." });
  if (!/^https?:\/\/[^\s]+$/i.test(url)) return res.status(400).json({ error: "Enter a valid http:// or https:// URL." });
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "module";
  let slug = base, n = 2;
  while ((await q("SELECT id FROM modules WHERE slug = $1", [slug])).rowCount) slug = `${base}-${n++}`;
  try {
    const r = await q("INSERT INTO modules (name, slug, category, icon, url, active) VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id", [name, slug, category, icon, url]);
    await logAction(req.session.user.id, "Module created", `${name} → ${url}`);
    res.json({ ok: true, id: r.rows[0].id, slug });
  } catch (err) { res.status(409).json({ error: "A module with this name already exists." }); }
});

app.patch("/api/modules/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const found = await q("SELECT * FROM modules WHERE id = $1", [id]);
  const existing = found.rows[0];
  if (!existing) return res.status(404).json({ error: "Module not found." });
  const name = String(req.body.name ?? existing.name).trim();
  const url = String(req.body.url ?? existing.url).trim();
  const category = String(req.body.category ?? existing.category).trim().toUpperCase() || "OTHER";
  const icon = String(req.body.icon ?? existing.icon).trim() || "◈";
  const active = req.body.active === false ? false : true;
  if (!name) return res.status(400).json({ error: "Module name is required." });
  if (!/^https?:\/\/[^\s]+$/i.test(url)) return res.status(400).json({ error: "Enter a valid http:// or https:// URL." });
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `module-${id}`;
  let slug = base, n = 2;
  while (true) {
    const x = await q("SELECT id FROM modules WHERE slug = $1 AND id <> $2", [slug, id]);
    if (!x.rowCount) break;
    slug = `${base}-${n++}`;
  }
  try {
    await q("UPDATE modules SET name=$1, slug=$2, category=$3, icon=$4, url=$5, active=$6 WHERE id=$7", [name, slug, category, icon, url, active, id]);
    await logAction(req.session.user.id, "Module updated", `${existing.name} → ${name} | ${url}`);
    res.json({ ok: true });
  } catch (err) { res.status(409).json({ error: "A module with this name already exists." }); }
});

app.delete("/api/modules/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const found = await q("SELECT id, name FROM modules WHERE id = $1", [id]);
  if (!found.rows[0]) return res.status(404).json({ error: "Module not found." });
  await q("DELETE FROM modules WHERE id = $1", [id]);
  await logAction(req.session.user.id, "Module deleted", found.rows[0].name);
  res.json({ ok: true });
});

app.get("/api/modules", requireAdmin, async (req, res) => {
  const r = await q("SELECT * FROM modules ORDER BY id");
  res.json({ modules: r.rows });
});

app.get("/api/users/:id/permissions", requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const userResult = await q("SELECT id, username, role, active FROM users WHERE id = $1", [userId]);
  const user = userResult.rows[0];
  if (!user) return res.status(404).json({ error: "User not found." });
  const r = await q(`
    SELECT m.id, m.name, m.slug, m.active,
           CASE WHEN $1 = 'admin' OR p.user_id IS NOT NULL THEN 1 ELSE 0 END AS granted
    FROM modules m LEFT JOIN permissions p ON p.module_id = m.id AND p.user_id = $2
    ORDER BY m.id
  `, [user.role, userId]);
  res.json({ user, permissions: r.rows });
});

app.put("/api/users/:id/permissions", requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const moduleIds = Array.isArray(req.body.moduleIds) ? [...new Set(req.body.moduleIds.map(Number).filter(Number.isInteger))] : [];
  const userResult = await q("SELECT username, role FROM users WHERE id = $1", [userId]);
  const user = userResult.rows[0];
  if (!user) return res.status(404).json({ error: "User not found." });
  const validResult = await q("SELECT id FROM modules WHERE active = TRUE");
  const validIds = new Set(validResult.rows.map(m => Number(m.id)));
  const safeIds = user.role === "admin" ? [...validIds] : moduleIds.filter(id => validIds.has(id));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM permissions WHERE user_id = $1", [userId]);
    for (const moduleId of safeIds) await client.query("INSERT INTO permissions (user_id, module_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [userId, moduleId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }
  await logAction(req.session.user.id, "Permissions updated", `${user.username}: ${safeIds.length} modules`);
  res.json({ ok: true, moduleIds: safeIds });
});

app.get("/api/activity", requireAdmin, async (req, res) => {
  const r = await q("SELECT a.id, a.action, a.details, a.created_at, u.username FROM activity_logs a LEFT JOIN users u ON u.id = a.admin_user_id ORDER BY a.id DESC LIMIT 100");
  res.json({ logs: r.rows });
});

// ---------------- NORMAL USER ----------------
app.get("/api/user-dashboard", requireLogin, async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user || !user.active) return res.status(401).json({ error: "Account is inactive." });
  const r = user.role === "admin"
    ? await q("SELECT id, name, slug, category, icon, url FROM modules WHERE active = TRUE ORDER BY id")
    : await q("SELECT m.id, m.name, m.slug, m.category, m.icon, m.url FROM modules m INNER JOIN permissions p ON p.module_id=m.id WHERE p.user_id=$1 AND m.active=TRUE ORDER BY m.id", [user.id]);
  res.json({ user: { id: user.id, username: user.username, role: user.role }, modules: r.rows });
});

app.get("/api/my-modules", requireLogin, async (req, res) => {
  const r = req.session.user.role === "admin"
    ? await q("SELECT id, name, slug, category, icon, url FROM modules WHERE active = TRUE ORDER BY id")
    : await q("SELECT m.id, m.name, m.slug, m.category, m.icon, m.url FROM modules m INNER JOIN permissions p ON p.module_id=m.id WHERE p.user_id=$1 AND m.active=TRUE ORDER BY m.id", [req.session.user.id]);
  res.json({ modules: r.rows });
});

app.get("/api/my-modules/:slug", requireLogin, async (req, res) => {
  const r = req.session.user.role === "admin"
    ? await q("SELECT id, name, slug, category, icon, url FROM modules WHERE slug=$1 AND active=TRUE", [req.params.slug])
    : await q("SELECT m.id, m.name, m.slug, m.category, m.icon, m.url FROM modules m INNER JOIN permissions p ON p.module_id=m.id WHERE p.user_id=$1 AND m.slug=$2 AND m.active=TRUE", [req.session.user.id, req.params.slug]);
  if (!r.rows[0]) return res.status(403).json({ error: "You do not have access to this module." });
  res.json({ module: r.rows[0], message: "Module access verified." });
});

app.use((req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

initDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`KRC GROUP central server running on port ${PORT} | timezone=${TZ}`));
  })
  .catch(err => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
