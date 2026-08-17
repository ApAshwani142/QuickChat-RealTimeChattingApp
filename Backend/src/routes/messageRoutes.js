const express = require('express')
const requireAuth = require('../middleware/auth')
const { getMessages, postMessage, patchMessage, deleteMessage, uploadMedia } = require('../controllers/messageController')

const router = express.Router()

router.get('/messages/:userId', requireAuth, getMessages)
router.post('/messages', requireAuth, postMessage)
router.post('/messages/upload', requireAuth, uploadMedia)
router.patch('/messages/:messageId', requireAuth, patchMessage)
router.delete('/messages/:messageId', requireAuth, deleteMessage)

module.exports = router
