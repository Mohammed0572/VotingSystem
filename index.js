const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

// ── Static File Serving ────────────────────────────
// Serve CSS, JS, assets, dist, and public files via express.static
app.use('/css', express.static(path.join(__dirname, 'src/css')));
app.use('/js', express.static(path.join(__dirname, 'src/js')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));
app.use('/dist', express.static(path.join(__dirname, 'src/dist')));
app.use(express.static(path.join(__dirname, 'public')));

// ── Authorization Middleware ───────────────────────
const authorizeUser = (req, res, next) => {
  const token = req.query.Authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).send('<h1 align="center"> Login to Continue </h1>');
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
};

// ── Routes ─────────────────────────────────────────

// Login page (default landing page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

// Admin dashboard (no auth — admin login is handled via Face Auth API)
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/admin.html'));
});

// Voter dashboard (JWT-protected)
app.get('/index.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

// ── Start Server ───────────────────────────────────
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
