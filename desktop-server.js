const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const cloudApiUrl = String(process.env.KRC_CLOUD_API_URL || '').trim().replace(/\/$/, '');

if (!cloudApiUrl) {
  throw new Error('KRC_CLOUD_API_URL is required for the Windows desktop client.');
}

app.use('/api', createProxyMiddleware({
  target: cloudApiUrl,
  changeOrigin: true,
  xfwd: true,
  cookieDomainRewrite: '',
  logLevel: 'warn'
}));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, mode: 'desktop-client', timezone: 'Asia/Kolkata' }));
app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`KRC GROUP desktop client proxy running on http://localhost:${PORT}`));
