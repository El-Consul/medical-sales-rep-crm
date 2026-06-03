const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح بالدخول، يرجى تسجيل الدخول أولاً' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production');
    req.user = decoded; // Contains id (userId) and email
    next();
  } catch (error) {
    return res.status(401).json({ error: 'توكن غير صالح أو انتهت صلاحيته' });
  }
};

module.exports = authMiddleware;
