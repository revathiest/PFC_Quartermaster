const jwt = require('jsonwebtoken');

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
  try {
    req.user = jwt.verify(token, secret);
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
  next();
}

module.exports = { authMiddleware };
