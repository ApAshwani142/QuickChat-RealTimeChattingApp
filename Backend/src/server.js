import 'dotenv/config'
import dns from 'dns'

// Configure DNS settings: override servers and force IPv4 preference to avoid ENETUNREACH on IPv6-unsupported hosting environments like Render
try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
  dns.setDefaultResultOrder('ipv4first')
} catch (err) {
  console.warn('Failed to configure DNS settings:', err.message)
}

import http from 'http'
import mongoose from 'mongoose'
import { Server } from 'socket.io'

import createApp from './app.js'
import { setupSocket } from './socket/index.js'

async function main() {
  const PORT = process.env.PORT || 5000
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment')

  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    })
    console.log(`MongoDB connected: ${mongoose.connection?.db?.databaseName} (auth OK)`)
  } catch (err) {
    console.error('MongoDB connection failed:')
    // Avoid leaking secrets: log only username+host.
    const match = String(MONGODB_URI).match(/^mongodb\+srv:\/\/([^:]+):.*@([^\/?]+)/i)
    if (match) console.error(`Trying auth as "${match[1]}" on host "${match[2]}"`)
    console.error(err?.message || err)
    process.exit(1)
  }

  const app = createApp()

  const httpServer = http.createServer(app)
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      credentials: true,
    },
  })

  // Allow controllers to access io if needed
  app.locals.io = io

  setupSocket(io)

  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

