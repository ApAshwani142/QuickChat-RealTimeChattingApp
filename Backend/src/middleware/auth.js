const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-tokens'

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.mfaPending) {
      return res.status(403).json({ error: 'MFA verification pending' })
    }
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = requireAuth
