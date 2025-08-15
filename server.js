require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const mongoose     = require('mongoose');
const cookieParser = require('cookie-parser');

const linkRoutes   = require('./routes/Links');
const authRoutes   = require('./routes/auth');
const payments     = require('./routes/payments');
const auth         = require('./middleware/auth');
const Link         = require('./models/Link');
const LinkVisit    = require('./models/LinkVisit');

const app = express();

// Render/Proxies
app.set('trust proxy', 1);

// ====== CORS ======
const isProd = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// ====== Webhook (si tu handler requiere raw body, mantenlo ANTES de express.json) ======
app.post('/api/payments/webhook', payments.webhookHandler, payments.webhookEndpoint);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log simple
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/payments', payments.router);

// Healthcheck (Render)
app.get('/health', (_, res) => res.status(200).send('ok'));

// Redirección por slug
app.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await Link.findOne({ slug });
    if (!link) return res.redirect('/notfound');

    await LinkVisit.create({
      linkId: link._id,
      phone: link.phone,
      userId: link.userId || -1,
    });

    const target = `https://wa.me/${link.phone}${link.text ? '?text=' + encodeURIComponent(link.text) : ''}`;
    return res.redirect(target);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Error del servidor');
  }
});

// ====== MongoDB ======
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@wa-link-db.hthtogq.mongodb.net/?retryWrites=true&w=majority&appName=wa-link-db';
console.log('→ Usando MongoDB en:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    mongoose.set('debug', true);
  })
  .catch(err => console.error('❌ Error conectando MongoDB:', err));

const PORT = process.env.PORT || 5000; // Render inyecta PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API corriendo en http://0.0.0.0:${PORT}`);
});
