const express = require('express');
const Stripe  = require('stripe');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const stripe  = Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  const token = req.cookies?.token;
  let userId = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      console.error('❌ Token inválido');
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: { name: 'Plan Premium' },
        unit_amount: 1000,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/?paid=true`,
    cancel_url: `${process.env.CLIENT_URL}/?paid=false`,
    metadata: {
      userId: userId || 'anon',
    }
  });

  res.json({ url: session.url });
});

const webhookHandler = express.raw({ type: 'application/json' });

const webhookEndpoint = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    console.log('💸 Sesión pagada:', session);

    if (userId && userId !== 'anon') {
      try {
        await User.findByIdAndUpdate(userId, { plan: 'premium' });
        console.log('✅ Usuario actualizado a premium');
      } catch (e) {
        console.error('❌ Error actualizando plan:', e);
      }
    }
  }

  res.sendStatus(200);
};

module.exports = {
  router,
  webhookHandler,
  webhookEndpoint,
};
