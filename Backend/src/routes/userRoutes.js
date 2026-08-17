import express from 'express'
import requireAuth from '../middleware/auth.js'
import { getUsers } from '../controllers/userController.js'

const router = express.Router()

router.get('/users', requireAuth, getUsers)

export default router
