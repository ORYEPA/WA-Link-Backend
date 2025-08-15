const User = require('../models/User');

module.exports = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(401).json({ msg: 'Usuario no encontrado' });

      if (user.plan !== requiredPlan) {
        return res.status(402).json({ msg: 'Actualiza a Premium para usar esta función.' });
      }

      next();
    } catch (err) {
      console.error('Error en checkPlan:', err);
      return res.status(500).json({ msg: 'Error al verificar el plan.' });
    }
  };
};
