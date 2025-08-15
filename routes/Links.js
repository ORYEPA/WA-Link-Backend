const express   = require('express');
const { nanoid } = require('nanoid');
const Link      = require('../models/Link');
const auth      = require('../middleware/auth');
const checkPlan = require('../middleware/plan');
const LinkVisit = require('../models/LinkVisit');
const User = require('../models/User');

const router = express.Router();

const jwt = require('jsonwebtoken'); 
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/', async (req, res) => {
  const { phone, text } = req.body;
  if (!phone) return res.status(400).json({ msg: 'El número es obligatorio.' });

  let userId = -1;
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      console.log('Token inválido o expirado');
    }
  }

  try {
    const existing = await Link.findOne({ phone, userId });
    if (existing) {
      return res.json({
        slug: existing.slug,
        url: `https://wa.me/${phone}?text=${encodeURIComponent(existing.text || '')}`
      });
    }

    let slug;
    do {
      slug = nanoid(6);
    } while (await Link.exists({ slug, userId: -1 })); 

    const link = new Link({ slug, phone, text, userId });
    await link.save();

    return res.json({
      slug,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(text || '')}`
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'No se pudo guardar el link.' });
  }
});


router.post('/custom', auth, checkPlan('premium'), async (req, res) => {
  const { customSlug, phone, text } = req.body;
  const userId = req.user.id;

  if (!customSlug || !phone)
    return res.status(400).json({ msg: 'Slug y número obligatorios.' });

  if (!/^[a-zA-Z0-9_-]+$/.test(customSlug))
    return res.status(400).json({ msg: 'Slug inválido.' });

  try {
    const existing = await Link.findOne({ slug: customSlug, userId, phone });
    if (existing) {
      return res.json({
        slug: existing.slug,
        url: `https://wa.me/${existing.phone}?text=${encodeURIComponent(existing.text || '')}`
      });
    }

    const link = new Link({
      slug: customSlug,
      phone,
      text,
      userId
    });
    await link.save();

    return res.json({
      slug: customSlug,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(text || '')}`
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'No se pudo guardar el link personalizado.' });
  }
});




router.get('/:slug', async (req, res) => {
  const link = await Link.findOne({ slug: req.params.slug });
  if (!link) return res.status(404).json({ error: 'No encontrado' });
  res.json(link);
});


module.exports = router;
