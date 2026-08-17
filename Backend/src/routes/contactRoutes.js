import express from 'express'
import requireAuth from '../middleware/auth.js'
import { addContact, getContacts, updateContact, deleteContact } from '../controllers/contactController.js'

const router = express.Router()

router.get('/contacts', requireAuth, getContacts)
router.post('/contacts', requireAuth, addContact)
router.patch('/contacts/:contactId', requireAuth, updateContact)
router.delete('/contacts/:contactId', requireAuth, deleteContact)

export default router
