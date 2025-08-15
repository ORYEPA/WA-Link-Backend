const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Faltan datos' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'El correo ya está en uso' });

  const user = new User({ email, password, name }); 
  await user.save();

  res.status(201).json({ msg: 'Usuario registrado' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { id: user._id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    })
    .json({ msg: 'Login correcto', name: user.name, id: user._id });
});


router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ msg: 'Logout exitoso' });
});



router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    plan: user.plan 
  });
});


module.exports = router;
