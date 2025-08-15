require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const mongoose      = require('mongoose');
const cookieParser  = require('cookie-parser');

const linkRoutes    = require('./routes/Links');
const authRoutes    = require('./routes/auth');
const payments = require('./routes/payments');
const auth          = require('./middleware/auth');
const Link          = require('./models/Link');
const LinkVisit     = require('./models/LinkVisit');


const app = express();
const path = require('path');


app.post('/api/payments/webhook', payments.webhookHandler, payments.webhookEndpoint);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());




app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true 
}));



// Log de todas las peticiones
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, req.body);
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/payments', payments.router);


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

    return res.redirect(`https://wa.me/${link.phone}${link.text ? '?text=' + encodeURIComponent(link.text) : ''}`);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Error del servidor');
  }
})


// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wa_link_test';
console.log('→ Usando MongoDB en:', MONGO_URI);
mongoose.connect(MONGO_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB conectado');
  mongoose.set('debug', true);
})
.catch(err => console.error('❌ Error conectando MongoDB:', err));

// Inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 API corriendo en http://localhost:${PORT}`)
);
