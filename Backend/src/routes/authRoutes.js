import express from 'express'
import {
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
} from '../controllers/authController.js'
import requireAuth from '../middleware/auth.js'

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

export default router
