import express from 'express'
import requireAuth from '../middleware/auth.js'
import { getMessages, postMessage, patchMessage, deleteMessage, uploadMedia } from '../controllers/messageController.js'

const router = express.Router()

router.get('/messages/:userId', requireAuth, getMessages)
router.post('/messages', requireAuth, postMessage)
router.post('/messages/upload', requireAuth, uploadMedia)
router.patch('/messages/:messageId', requireAuth, patchMessage)
router.delete('/messages/:messageId', requireAuth, deleteMessage)

export default router
