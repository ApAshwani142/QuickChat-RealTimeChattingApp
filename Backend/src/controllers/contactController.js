const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const User = require('../models/User')
const Contact = require('../models/Contact')

function normalizeUsername(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function normalizeMobile(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function addContact(req, res) {
  const ownerId = req.userId
  const username = normalizeUsername(req.body?.username)
  const mobile = normalizeMobile(req.body?.mobile)

  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  const owner = await User.findById(ownerId).select('username mobile').lean()
  if (owner) {
    const sameUsername = owner.username?.toLowerCase() === username.toLowerCase()
    const sameMobile = mobile && owner.mobile && owner.mobile === mobile
    if (sameUsername || sameMobile) return res.status(400).json({ error: 'You cannot add yourself' })
  }

  // Validation: Check the database with the entered username before successfully adding the contact
  let contactUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
  if (!contactUser) {
    return res.status(404).json({ error: `User "${username}" does not exist in the database` })
  }

  // If user exists but missing/old mobile, sync it.
  let changed = false
  if (mobile && contactUser.mobile !== mobile) {
    const collision = await User.findOne({ mobile, _id: { $ne: contactUser._id } })
    if (collision) {
      return res.status(400).json({ error: 'This mobile number is already in use by another user' })
    }
    contactUser.mobile = mobile
    changed = true
  }
  if (changed) {
    contactUser = await contactUser.save()
  }

  if (!contactUser._id) {
    return res.status(400).json({ error: 'Invalid contact user' })
  }

  // If contact already exists, just return it.
  const existing = await Contact.findOne({ ownerId, contactId: contactUser._id }).lean()
  if (!existing) {
    await Contact.create({ ownerId, contactId: contactUser._id })
  }

  return res.json({
    contact: {
      contactId: String(contactUser._id),
      username: contactUser.username,
      mobile: contactUser.mobile,
    },
  })
}

async function getContacts(req, res) {
  const ownerId = req.userId

  if (!mongoose.isValidObjectId(ownerId)) {
    return res.status(400).json({ error: 'Invalid user id' })
  }

  // 1. Fetch explicitly added contacts
  const dbContacts = await Contact.find({ ownerId })
    .populate('contactId', '_id username mobile email profileImage statusMessage socketId')
    .sort({ createdAt: -1 })
    .lean()

  // 2. Fetch all users from message history to show active conversation partners
  const Message = require('../models/Message')
  const messages = await Message.find({
    $or: [
      { senderId: ownerId },
      { receiverId: ownerId },
    ],
  }).select('senderId receiverId').lean()

  const partnerIds = new Set()
  messages.forEach((m) => {
    const sId = String(m.senderId)
    const rId = String(m.receiverId)
    if (sId !== String(ownerId)) partnerIds.add(sId)
    if (rId !== String(ownerId)) partnerIds.add(rId)
  })

  // 3. Retrieve partner details
  const User = require('../models/User')
  const conversationUsers = await User.find({ _id: { $in: Array.from(partnerIds) } })
    .select('_id username mobile email profileImage statusMessage socketId')
    .lean()

  // 4. Merge contacts and conversation users (avoiding duplicates)
  const mergedUsersMap = new Map()

  // Add explicit contacts first
  dbContacts.forEach((c) => {
    if (c.contactId) {
      const cId = String(c.contactId._id)
      mergedUsersMap.set(cId, {
        contactId: cId,
        userId: cId,
        username: c.contactId.username,
        mobile: c.contactId.mobile,
        email: c.contactId.email || '',
        profileImage: c.contactId.profileImage || null,
        statusMessage: c.contactId.statusMessage || '',
        isOnline: Boolean(c.contactId.socketId),
      })
    }
  })

  // Add conversation partners
  conversationUsers.forEach((u) => {
    const uId = String(u._id)
    if (!mergedUsersMap.has(uId)) {
      mergedUsersMap.set(uId, {
        contactId: uId,
        userId: uId,
        username: u.username,
        mobile: u.mobile,
        email: u.email || '',
        profileImage: u.profileImage || null,
        statusMessage: u.statusMessage || '',
        isOnline: Boolean(u.socketId),
      })
    }
  })

  return res.json({
    contacts: Array.from(mergedUsersMap.values()),
  })
}

async function updateContact(req, res) {
  const ownerId = req.userId
  const contactId = req.params.contactId

  const username = normalizeUsername(req.body?.username)
  const mobile = normalizeMobile(req.body?.mobile)

  if (!mongoose.isValidObjectId(ownerId) || !mongoose.isValidObjectId(contactId)) {
    return res.status(400).json({ error: 'Invalid ids' })
  }

  const existing = await Contact.findOne({ ownerId, contactId }).lean()
  if (!existing) return res.status(404).json({ error: 'Contact not found' })

  const contactUser = await User.findById(contactId)
  if (!contactUser) return res.status(404).json({ error: 'Contact user not found' })

  if (!username && !mobile) return res.status(400).json({ error: 'username and/or mobile are required' })

  if (username) contactUser.username = username
  if (mobile) contactUser.mobile = mobile

  try {
    await contactUser.save()
  } catch (err) {
    // Duplicate key errors (e.g. mobile already used)
    if (err?.code === 11000) return res.status(400).json({ error: 'Mobile already exists' })
    return res.status(500).json({ error: 'Failed to update contact' })
  }

  return res.json({
    contact: {
      contactId: String(contactUser._id),
      username: contactUser.username,
      mobile: contactUser.mobile,
    },
  })
}

async function deleteContact(req, res) {
  const ownerId = req.userId
  const contactId = req.params.contactId

  if (!mongoose.isValidObjectId(ownerId) || !mongoose.isValidObjectId(contactId)) {
    return res.status(400).json({ error: 'Invalid ids' })
  }

  const result = await Contact.deleteOne({ ownerId, contactId })
  if (!result.deletedCount) return res.status(404).json({ error: 'Contact not found' })

  return res.json({ ok: true })
}

module.exports = { addContact, getContacts, updateContact, deleteContact }

