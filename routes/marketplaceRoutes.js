const express = require('express')
const router = express.Router()
const { getListings, createListing, deleteListing } = require('../controllers/marketplaceController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/', getListings)
router.post('/', protect, createListing)
router.delete('/:id', protect, deleteListing)

module.exports = router
