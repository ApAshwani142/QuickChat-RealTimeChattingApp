const express = require('express')
const {
  signup,
  login,
  sendSignupOtp,
  sendLoginOtp,
  verifyMfaLogin,
  setupMfa,
  enableMfa,
  disableMfa,
  getProfile,
  updateProfile,
} = require('../controllers/authController')
const requireAuth = require('../middleware/auth')

const router = express.Router()

router.post('/auth/signup/send-otp', sendSignupOtp)
router.post('/auth/signup', signup)
router.post('/auth/login/send-otp', sendLoginOtp)
router.post('/auth/login', login)
router.post('/auth/mfa/verify-login', verifyMfaLogin)

// Protected routes
router.get('/auth/profile', requireAuth, getProfile)
router.put('/auth/profile', requireAuth, updateProfile)
router.post('/auth/mfa/setup', requireAuth, setupMfa)
router.post('/auth/mfa/enable', requireAuth, enableMfa)
router.post('/auth/mfa/disable', requireAuth, disableMfa)

module.exports = router
