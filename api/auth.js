const { verify } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);
  const payload = verify(token, secret);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  req.user = payload;
  next();
}

module.exports = { authMiddleware };
