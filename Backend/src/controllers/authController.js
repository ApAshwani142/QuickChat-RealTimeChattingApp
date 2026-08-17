const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { generateSecret, generateURI, verify } = require('otplib')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')
const User = require('../models/User')
const Otp = require('../models/Otp')
const { sendOtpEmail } = require('../services/emailService')

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-tokens'

async function sendSignupOtp(req, res) {
  try {
    const { username, email, mobile } = req.body || {}
    const normalizedUsername = typeof username === 'string' ? username.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedMobile = typeof mobile === 'string' ? mobile.trim() : ''

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Username is required' })
    }
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Check username collision
    const existingUser = await User.findOne({ username: normalizedUsername })
    if (existingUser && existingUser.isRegistered) {
      return res.status(400).json({ error: 'Username is already taken' })
    }

    // Check email collision
    const existingEmail = await User.findOne({ email: normalizedEmail })
    if (existingEmail && existingEmail.isRegistered) {
      return res.status(400).json({ error: 'Email is already registered' })
    }

    // Check mobile collision
    if (normalizedMobile) {
      const existingMobile = await User.findOne({ mobile: normalizedMobile })
      if (existingMobile && existingMobile.isRegistered) {
        return res.status(400).json({ error: 'Mobile number is already registered' })
      }
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save/update OTP in database
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, expiresAt },
      { upsert: true, returnDocument: 'after' }
    )

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp)

    return res.json({ success: true, message: 'OTP sent to email successfully' })
  } catch (err) {
    console.error('Send signup OTP error:', err)
    return res.status(500).json({ error: 'Failed to send OTP. Please check email address.' })
  }
}

async function signup(req, res) {
  try {
    const { username, email, mobile, password, otp } = req.body || {}
    const normalizedUsername = typeof username === 'string' ? username.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedMobile = typeof mobile === 'string' ? mobile.trim() : ''

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Username is required' })
    }
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }
    if (!otp) {
      return res.status(400).json({ error: 'Verification OTP is required' })
    }

    // Check OTP validation
    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() })
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    // Remove the OTP record since it's verified/used
    await Otp.deleteOne({ _id: otpRecord._id })

    // Check username collision
    const existingUser = await User.findOne({ username: normalizedUsername })
    if (existingUser) {
      if (existingUser.isRegistered) {
        return res.status(400).json({ error: 'Username is already taken' })
      }
      // Stub exists, claim it!
      existingUser.password = await bcrypt.hash(password, 10)
      existingUser.email = normalizedEmail
      if (normalizedMobile) existingUser.mobile = normalizedMobile
      existingUser.isRegistered = true
      await existingUser.save()
      return res.status(201).json({
        success: true,
        userId: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        mobile: existingUser.mobile,
      })
    }

    // Check email collision
    const existingEmail = await User.findOne({ email: normalizedEmail })
    if (existingEmail && existingEmail.isRegistered) {
      return res.status(400).json({ error: 'Email is already registered' })
    }

    // Check mobile collision
    if (normalizedMobile) {
      const existingMobile = await User.findOne({ mobile: normalizedMobile })
      if (existingMobile && existingMobile.isRegistered) {
        return res.status(400).json({ error: 'Mobile number is already registered' })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      mobile: normalizedMobile || undefined,
      password: hashedPassword,
      isRegistered: true,
    })

    return res.status(201).json({
      success: true,
      userId: user._id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Internal server error during registration' })
  }
}

async function sendLoginOtp(req, res) {
  try {
    const { username, mobile, password } = req.body || {}
    const normalizedUsername = typeof username === 'string' ? username.trim() : ''
    const normalizedMobile = typeof mobile === 'string' ? mobile.trim() : ''

    if (!normalizedUsername && !normalizedMobile) {
      return res.status(400).json({ error: 'Username or mobile number is required' })
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    let user = null
    if (normalizedMobile) {
      user = await User.findOne({ mobile: normalizedMobile })
    }
    if (!user && normalizedUsername) {
      user = await User.findOne({ username: normalizedUsername })
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/mobile or password' })
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/mobile or password' })
    }

    if (!user.email) {
      return res.status(400).json({ error: 'This account has no registered email. Please contact support.' })
    }

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save/update OTP in database
    await Otp.findOneAndUpdate(
      { email: user.email },
      { otp, expiresAt },
      { upsert: true, returnDocument: 'after' }
    )

    // Send OTP email
    await sendOtpEmail(user.email, otp)

    // Return success and masked email for UX
    const parts = user.email.split('@')
    const maskedLocal = parts[0].length > 2 
      ? parts[0][0] + '*'.repeat(parts[0].length - 2) + parts[0].slice(-1)
      : '*'.repeat(parts[0].length)
    const maskedEmail = `${maskedLocal}@${parts[1]}`

    return res.json({ 
      success: true, 
      message: 'OTP sent to registered email successfully', 
      maskedEmail 
    })
  } catch (err) {
    console.error('Send login OTP error:', err)
    return res.status(500).json({ error: 'Failed to send OTP to registered email' })
  }
}

async function login(req, res) {
  try {
    const { username, mobile, password, otp } = req.body || {}
    const normalizedUsername = typeof username === 'string' ? username.trim() : ''
    const normalizedMobile = typeof mobile === 'string' ? mobile.trim() : ''

    if (!normalizedUsername && !normalizedMobile) {
      return res.status(400).json({ error: 'Username or mobile number is required' })
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }
    if (!otp) {
      return res.status(400).json({ error: 'Verification OTP is required' })
    }

    let user = null
    if (normalizedMobile) {
      user = await User.findOne({ mobile: normalizedMobile })
    }
    if (!user && normalizedUsername) {
      user = await User.findOne({ username: normalizedUsername })
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/mobile or password' })
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/mobile or password' })
    }

    // Verify OTP
    if (!user.email) {
      return res.status(400).json({ error: 'No registered email found for this user' })
    }
    const otpRecord = await Otp.findOne({ email: user.email, otp: otp.trim() })
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    // Remove the OTP record since it's verified/used
    await Otp.deleteOne({ _id: otpRecord._id })

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Issue a short-lived temporary token with mfaPending flag
      const tempToken = jwt.sign(
        { userId: user._id, mfaPending: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      )
      return res.json({
        mfaRequired: true,
        tempToken,
      })
    }

    // If MFA is not enabled, return a full token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.json({
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      mfaEnabled: false,
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error during login' })
  }
}

async function verifyMfaLogin(req, res) {
  try {
    const { tempToken, code } = req.body || {}
    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Temporary token and MFA code are required' })
    }

    // Verify the temporary token
    let decoded
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Temporary login token expired or invalid' })
    }

    if (!decoded.mfaPending) {
      return res.status(400).json({ error: 'Invalid session for MFA verification' })
    }

    const user = await User.findById(decoded.userId)
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA is not enabled for this user' })
    }

    // Check TOTP code or backup codes
    let isValid = false
    try {
      if (/^\d{6}$/.test(code)) {
        const verifyResult = await verify({ token: code, secret: user.mfaSecret })
        isValid = verifyResult?.valid || false
      }
    } catch (err) {
      console.warn('TOTP verification warning:', err.message)
    }
    let isBackupUsed = false

    if (!isValid && user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      // Check backup codes
      for (let i = 0; i < user.mfaBackupCodes.length; i++) {
        const match = await bcrypt.compare(code, user.mfaBackupCodes[i])
        if (match) {
          isValid = true
          isBackupUsed = true
          // Remove used backup code
          user.mfaBackupCodes.splice(i, 1)
          await user.save()
          break
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid verification code' })
    }

    // MFA verify success, issue full JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.json({
      token,
      userId: user._id,
      username: user.username,
      mobile: user.mobile,
      mfaEnabled: true,
      backupCodeUsed: isBackupUsed,
    })
  } catch (err) {
    console.error('MFA login verification error:', err)
    return res.status(500).json({ error: 'Internal server error during verification' })
  }
}

async function setupMfa(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate secret
    const secret = generateSecret()
    user.mfaTempSecret = secret
    await user.save()

    // Create otpauth URL
    const otpauthUrl = generateURI({ secret, account: user.username, issuer: 'QuickChat' })

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl)

    return res.json({
      secret,
      qrCodeUrl,
    })
  } catch (err) {
    console.error('MFA setup error:', err)
    return res.status(500).json({ error: 'Internal server error setting up MFA' })
  }
}

async function enableMfa(req, res) {
  try {
    const { code } = req.body || {}
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!user.mfaTempSecret) {
      return res.status(400).json({ error: 'MFA setup has not been initiated' })
    }

    let isValid = false
    try {
      if (/^\d{6}$/.test(code)) {
        const verifyResult = await verify({ token: code, secret: user.mfaTempSecret })
        isValid = verifyResult?.valid || false
      }
    } catch (err) {
      console.warn('TOTP enabling verify warning:', err.message)
    }
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Enable MFA
    user.mfaSecret = user.mfaTempSecret
    user.mfaTempSecret = null
    user.mfaEnabled = true

    // Generate 6 backup codes
    const backupCodes = []
    const hashedBackupCodes = []
    for (let i = 0; i < 6; i++) {
      // 8-character numeric/alpha random code
      const rawCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      backupCodes.push(rawCode)
      const hashed = await bcrypt.hash(rawCode, 8)
      hashedBackupCodes.push(hashed)
    }
    user.mfaBackupCodes = hashedBackupCodes

    await user.save()

    return res.json({
      success: true,
      backupCodes,
    })
  } catch (err) {
    console.error('MFA enabling error:', err)
    return res.status(500).json({ error: 'Internal server error enabling MFA' })
  }
}

async function disableMfa(req, res) {
  try {
    const { password, code } = req.body || {}
    if (!password || !code) {
      return res.status(400).json({ error: 'Password and verification code are required' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Check OTP code or backup code
    let isValid = false
    try {
      if (/^\d{6}$/.test(code)) {
        const verifyResult = await verify({ token: code, secret: user.mfaSecret })
        isValid = verifyResult?.valid || false
      }
    } catch (err) {
      console.warn('TOTP disable verify warning:', err.message)
    }
    if (!isValid && user.mfaBackupCodes) {
      for (let i = 0; i < user.mfaBackupCodes.length; i++) {
        const match = await bcrypt.compare(code, user.mfaBackupCodes[i])
        if (match) {
          isValid = true
          break
        }
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification or backup code' })
    }

    // Disable MFA
    user.mfaEnabled = false
    user.mfaSecret = null
    user.mfaBackupCodes = []
    user.mfaTempSecret = null
    await user.save()

    return res.json({ success: true })
  } catch (err) {
    console.error('MFA disable error:', err)
    return res.status(500).json({ error: 'Internal server error disabling MFA' })
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('username mobile email profileImage statusMessage mfaEnabled')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({
      username: user.username,
      mobile: user.mobile,
      email: user.email || '',
      profileImage: user.profileImage,
      statusMessage: user.statusMessage,
      mfaEnabled: user.mfaEnabled,
    })
  } catch (err) {
    console.error('Profile fetch error:', err)
    return res.status(500).json({ error: 'Internal server error fetching profile' })
  }
}

async function updateProfile(req, res) {
  try {
    const { email, mobile, statusMessage, profileImage, password } = req.body || {}
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (typeof email === 'string') {
      const emailTrimmed = email.trim().toLowerCase()
      if (emailTrimmed && emailTrimmed !== user.email) {
        // Collision check
        const coll = await User.findOne({ email: emailTrimmed })
        if (coll) return res.status(400).json({ error: 'Email is already in use' })
        user.email = emailTrimmed
      } else if (!emailTrimmed) {
        user.email = undefined
      }
    }

    if (typeof mobile === 'string') {
      const mobTrimmed = mobile.trim()
      if (mobTrimmed && mobTrimmed !== user.mobile) {
        const coll = await User.findOne({ mobile: mobTrimmed })
        if (coll) return res.status(400).json({ error: 'Mobile number is already in use' })
        user.mobile = mobTrimmed
      } else if (!mobTrimmed) {
        user.mobile = undefined
      }
    }

    if (typeof statusMessage === 'string') {
      user.statusMessage = statusMessage.trim() || 'Hey there! I am using QuickChat.'
    }

    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10)
    }

    // Save base64 image if provided
    if (profileImage && profileImage.startsWith('data:')) {
      const matches = profileImage.match(/^data:([^;]+);base64,(.+)$/)
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'png'
        const buffer = Buffer.from(matches[2], 'base64')
        const fileName = `profile_${user._id}_${Date.now()}.${ext}`
        const filePath = path.join(__dirname, '../../public/uploads', fileName)
        fs.writeFileSync(filePath, buffer)
        user.profileImage = `/uploads/${fileName}`
      }
    }

    await user.save()

    return res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email || '',
        mobile: user.mobile || '',
        profileImage: user.profileImage,
        statusMessage: user.statusMessage,
        mfaEnabled: user.mfaEnabled,
      },
    })
  } catch (err) {
    console.error('Profile update error:', err)
    return res.status(500).json({ error: 'Internal server error updating profile' })
  }
}

module.exports = {
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
}
