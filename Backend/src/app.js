const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const messageRoutes = require('./routes/messageRoutes')
const contactRoutes = require('./routes/contactRoutes')

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../public/uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

function createApp() {
  const app = express()

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || '*',
      credentials: true,
    }),
  )
  
  // Increase payload limits for base64 file uploads (avatars/media)
  app.use(express.json({ limit: '25mb' }))
  app.use(express.urlencoded({ limit: '25mb', extended: true }))

  // Static uploads directory serving
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

  app.get('/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', authRoutes)
  app.use('/api', userRoutes)
  app.use('/api', messageRoutes)
  app.use('/api', contactRoutes)

  return app
}

module.exports = createApp
