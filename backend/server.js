require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const generateRouter = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: '*', // Restrict in production to your app's domain/bundle
    methods: ['GET', 'POST'],
  })
);

// ── Rate Limiting ────────────────────────────────────────────────────────────
// Global: 100 requests / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait before trying again.' },
  })
);

// Stricter limit on generate endpoint (costs money per call)
const generateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,                   // 15 generations per 10 min (= 3 full 5-style runs)
  message: { error: 'Generation limit reached. Please wait 10 minutes.' },
});

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // base64 images can be large
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ 
  message: 'Clipart Studio API is online',
  docs: 'https://github.com/mahendrakumar19/clipart-studio',
  status: 'active'
}));
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.use('/api/generate', generateLimiter, generateRouter);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Clipart backend running on port ${PORT}`);
});
