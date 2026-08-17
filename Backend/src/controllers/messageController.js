const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const Message = require('../models/Message')
const User = require('../models/User')
const { emitReceiveMessageToParticipants, emitMessageUpdatedToParticipants, emitMessageDeletedToParticipants } = require('../socket')

function toObjectId(id) {
  if (!id) return null
  if (mongoose.isValidObjectId(id)) return id
  return null
}

async function getMessages(req, res) {
  const currentUserId = req.userId
  const otherUserId = req.params.userId

  if (!toObjectId(currentUserId) || !toObjectId(otherUserId)) {
    return res.status(400).json({ error: 'Invalid user id' })
  }

  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: currentUserId },
    ],
  })
    .sort({ timestamp: 1 })
    .lean()

  const normalized = messages.map((m) => ({
    messageId: String(m._id),
    senderId: String(m.senderId),
    receiverId: String(m.receiverId),
    text: m.text,
    status: m.status || 'sent',
    mediaUrl: m.mediaUrl || null,
    mediaType: m.mediaType || null,
    fileName: m.fileName || null,
    fileSize: m.fileSize || null,
    timestamp: m.timestamp,
  }))

  return res.json({ messages: normalized })
}

async function postMessage(req, res) {
  const currentUserId = req.userId
  const { receiverId, receiverMobile, text, mediaUrl, mediaType, fileName, fileSize } = req.body || {}

  if (!toObjectId(currentUserId)) {
    return res.status(400).json({ error: 'Invalid sender credentials' })
  }

  if (!text && !mediaUrl) {
    return res.status(400).json({ error: 'Message text or media is required' })
  }

  let resolvedReceiverId = receiverId
  const receiverMobileNormalized = typeof receiverMobile === 'string' ? receiverMobile.trim() : null
  if (receiverMobileNormalized) {
    const receiver = await User.findOne({ mobile: receiverMobileNormalized })
    if (!receiver) return res.status(400).json({ error: 'Invalid receiverMobile' })
    resolvedReceiverId = receiver._id
  }

  if (!toObjectId(resolvedReceiverId)) {
    return res.status(400).json({ error: 'receiverId or receiverMobile are required' })
  }

  const message = await Message.create({
    senderId: currentUserId,
    receiverId: resolvedReceiverId,
    text: text ? text.trim() : undefined,
    mediaUrl: mediaUrl || undefined,
    mediaType: mediaType || undefined,
    fileName: fileName || undefined,
    fileSize: fileSize || undefined,
  })

  // If sockets are connected, deliver in realtime.
  await emitReceiveMessageToParticipants(message)

  return res.json({ message })
}

async function patchMessage(req, res) {
  const userId = req.userId
  const messageId = req.params.messageId

  if (!toObjectId(messageId) || !toObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid ids' })
  }

  const { text } = req.body || {}
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' })
  }

  const normalized = text.trim()
  if (!normalized) return res.status(400).json({ error: 'text cannot be empty' })

  const message = await Message.findById(messageId)
  if (!message) return res.status(404).json({ error: 'Message not found' })

  if (String(message.senderId) !== String(userId)) return res.status(403).json({ error: 'Not allowed' })

  message.text = normalized
  await message.save()

  await emitMessageUpdatedToParticipants(message)

  return res.json({ message })
}

async function deleteMessage(req, res) {
  const userId = req.userId
  const messageId = req.params.messageId

  if (!toObjectId(messageId) || !toObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid ids' })
  }

  const message = await Message.findById(messageId).lean()
  if (!message) return res.status(404).json({ error: 'Message not found' })

  if (String(message.senderId) !== String(userId)) return res.status(403).json({ error: 'Not allowed' })

  await Message.deleteOne({ _id: messageId })

  await emitMessageDeletedToParticipants(message)

  return res.json({ ok: true })
}

async function uploadMedia(req, res) {
  try {
    const { file, fileName, fileType } = req.body || {}
    if (!file || !fileName || !fileType) {
      return res.status(400).json({ error: 'file, fileName, and fileType are required' })
    }

    if (!file.startsWith('data:')) {
      return res.status(400).json({ error: 'Invalid file format, expected base64 data URI' })
    }

    const matches = file.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Failed to parse file base64 data' })
    }

    const buffer = Buffer.from(matches[2], 'base64')
    const uniqueFileName = `file_${Date.now()}_${fileName.replace(/\s+/g, '_')}`
    const filePath = path.join(__dirname, '../../public/uploads', uniqueFileName)

    fs.writeFileSync(filePath, buffer)

    return res.json({
      success: true,
      url: `/uploads/${uniqueFileName}`,
      type: fileType,
      fileName,
      fileSize: `${(buffer.length / 1024).toFixed(1)} KB`,
    })
  } catch (err) {
    console.error('File upload error:', err)
    return res.status(500).json({ error: 'Internal server error uploading media file' })
  }
}

module.exports = {
  getMessages,
  postMessage,
  patchMessage,
  deleteMessage,
  uploadMedia,
}
