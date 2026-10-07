const jwt = require('jsonwebtoken');

// Protects private routes. Expects: Authorization: Bearer <token>
// On success it attaches req.user = { id } and the request continues.
// The token only carries the user id — fresh user data is fetched from the
// database whenever a controller needs it, so a changed profile is never stale.
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized — token is invalid or expired' });
  }
};

module.exports = { protect };
