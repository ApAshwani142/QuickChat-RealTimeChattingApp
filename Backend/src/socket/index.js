import User from '../models/User.js'
import Message from '../models/Message.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-tokens'

// userId (string) -> socketId
const onlineUsers = new Map()
// socketId -> userId (string)
const socketIdToUserId = new Map()

let ioInstance = null

function formatMessagePayload(messageDoc) {
  return {
    messageId: String(messageDoc._id),
    senderId: String(messageDoc.senderId),
    receiverId: String(messageDoc.receiverId),
    text: messageDoc.text,
    status: messageDoc.status || 'sent',
    mediaUrl: messageDoc.mediaUrl || null,
    mediaType: messageDoc.mediaType || null,
    fileName: messageDoc.fileName || null,
    fileSize: messageDoc.fileSize || null,
    timestamp: messageDoc.timestamp,
  }
}

async function emitReceiveMessageToParticipants(messageDoc) {
  if (!ioInstance) return

  const payload = formatMessagePayload(messageDoc)
  const senderSocketId = onlineUsers.get(payload.senderId)
  const receiverSocketId = onlineUsers.get(payload.receiverId)

  if (senderSocketId) {
    ioInstance.to(senderSocketId).emit('receive_message', payload)
  }
  if (receiverSocketId && receiverSocketId !== senderSocketId) {
    ioInstance.to(receiverSocketId).emit('receive_message', payload)
  }
}

async function emitMessageUpdatedToParticipants(messageDoc) {
  if (!ioInstance) return

  const payload = formatMessagePayload(messageDoc)
  const senderSocketId = onlineUsers.get(payload.senderId)
  const receiverSocketId = onlineUsers.get(payload.receiverId)

  if (senderSocketId) {
    ioInstance.to(senderSocketId).emit('message_updated', payload)
  }
  if (receiverSocketId && receiverSocketId !== senderSocketId) {
    ioInstance.to(receiverSocketId).emit('message_updated', payload)
  }
}

async function emitMessageDeletedToParticipants(messageDoc) {
  if (!ioInstance) return

  const payload = {
    messageId: String(messageDoc._id),
    senderId: String(messageDoc.senderId),
    receiverId: String(messageDoc.receiverId),
  }

  const senderSocketId = onlineUsers.get(payload.senderId)
  const receiverSocketId = onlineUsers.get(payload.receiverId)

  if (senderSocketId) {
    ioInstance.to(senderSocketId).emit('message_deleted', payload)
  }
  if (receiverSocketId && receiverSocketId !== senderSocketId) {
    ioInstance.to(receiverSocketId).emit('message_deleted', payload)
  }
}

async function handleUserConnected(socket) {
  if (!ioInstance) return

  const userId = socket.userId
  if (!userId) return

  const user = await User.findById(userId)
  if (!user) return

  user.socketId = socket.id
  await user.save()

  const userIdStr = String(user._id)
  onlineUsers.set(userIdStr, socket.id)
  socketIdToUserId.set(socket.id, userIdStr)

  // 1. Mark undelivered messages to this user as 'delivered' and notify senders
  const undelivered = await Message.find({ receiverId: userIdStr, status: 'sent' }).lean()
  if (undelivered.length > 0) {
    await Message.updateMany({ receiverId: userIdStr, status: 'sent' }, { $set: { status: 'delivered' } })
    
    // Group message IDs by their sender
    const messagesBySender = new Map()
    undelivered.forEach((m) => {
      const sId = String(m.senderId)
      if (!messagesBySender.has(sId)) messagesBySender.set(sId, [])
      messagesBySender.get(sId).push(String(m._id))
    })

    for (const [senderIdStr, msgIds] of messagesBySender.entries()) {
      const senderSocketId = onlineUsers.get(senderIdStr)
      if (senderSocketId) {
        ioInstance.to(senderSocketId).emit('messages_delivered', {
          receiverId: userIdStr,
          messageIds: msgIds,
        })
      }
    }
  }

  // Notify everyone user is online
  ioInstance.emit('user_online', { userId: userIdStr, username: user.username })
}

async function handleDisconnect(socket) {
  const userIdStr = socketIdToUserId.get(socket.id)
  if (!userIdStr) return

  const currentSocketId = onlineUsers.get(userIdStr)
  if (currentSocketId !== socket.id) {
    socketIdToUserId.delete(socket.id)
    return
  }

  socketIdToUserId.delete(socket.id)
  onlineUsers.delete(userIdStr)

  const user = await User.findById(userIdStr)
  if (user && user.socketId === socket.id) {
    user.socketId = null
    await user.save()
  }

  ioInstance?.emit('user_offline', { userId: userIdStr, username: user?.username })
}

function setupSocket(io) {
  ioInstance = io

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
    if (!token) {
      return next(new Error('Authentication error: Token is required'))
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.mfaPending) {
        return next(new Error('Authentication error: MFA verification pending'))
      }
      socket.userId = decoded.userId
      next()
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    handleUserConnected(socket).catch(console.error)

    socket.on('send_message', async (payload) => {
      const { receiverId, receiverMobile, text, mediaUrl, mediaType, fileName, fileSize } = payload || {}
      const senderId = socket.userId
      if (!senderId) return

      if (!text && !mediaUrl) return

      try {
        const receiverMobileNormalized = typeof receiverMobile === 'string' ? receiverMobile.trim() : null
        let resolvedReceiverId = null
        if (receiverMobileNormalized) {
          const receiver = await User.findOne({ mobile: receiverMobileNormalized })
          if (!receiver) return
          resolvedReceiverId = String(receiver._id)
        } else if (receiverId && mongoose.isValidObjectId(receiverId)) {
          resolvedReceiverId = receiverId
        }

        if (!resolvedReceiverId) return

        // If the receiver is online, default delivery status to 'delivered', else 'sent'
        const isOnline = onlineUsers.has(String(resolvedReceiverId))

        const message = await Message.create({
          senderId,
          receiverId: resolvedReceiverId,
          text: text ? text.trim() : undefined,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
          fileName: fileName || undefined,
          fileSize: fileSize || undefined,
          status: isOnline ? 'delivered' : 'sent',
        })

        await emitReceiveMessageToParticipants(message)
      } catch (err) {
        console.error(err)
      }
    })

    // Listen when a user reads a conversation
    socket.on('read_messages', async (payload) => {
      const senderId = payload?.senderId // the other user (who sent the messages)
      const receiverId = socket.userId // current user (who is reading them)
      if (!senderId || !receiverId) return

      try {
        const unread = await Message.find({ senderId, receiverId, status: { $ne: 'read' } }).lean()
        if (unread.length > 0) {
          await Message.updateMany(
            { senderId, receiverId, status: { $ne: 'read' } },
            { $set: { status: 'read' } }
          )

          const msgIds = unread.map((m) => String(m._id))
          const senderSocketId = onlineUsers.get(String(senderId))

          if (senderSocketId) {
            ioInstance.to(senderSocketId).emit('messages_read', {
              receiverId,
              messageIds: msgIds,
            })
          }
        }
      } catch (err) {
        console.error('Socket read_messages error:', err)
      }
    })

    socket.on('disconnect', () => {
      handleDisconnect(socket).catch(console.error)
    })
  })
}

export {
  setupSocket,
  emitReceiveMessageToParticipants,
  emitMessageUpdatedToParticipants,
  emitMessageDeletedToParticipants,
}
