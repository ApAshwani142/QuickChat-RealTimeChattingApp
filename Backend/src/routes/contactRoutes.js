const express = require('express')
const requireAuth = require('../middleware/auth')
const { addContact, getContacts, updateContact, deleteContact } = require('../controllers/contactController')

const router = express.Router()

router.get('/contacts', requireAuth, getContacts)
router.post('/contacts', requireAuth, addContact)
router.patch('/contacts/:contactId', requireAuth, updateContact)
router.delete('/contacts/:contactId', requireAuth, deleteContact)

module.exports = router
