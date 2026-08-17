const express = require('express')
const requireAuth = require('../middleware/auth')
const { getUsers } = require('../controllers/userController')

const router = express.Router()

router.get('/users', requireAuth, getUsers)

module.exports = router
