const Marketplace = require('../models/Marketplace')

// @route   GET /api/marketplace
// @access  Public
const getListings = async (req, res) => {
  try {
    const { type, county, waste } = req.query
    const filter = { isActive: true }
    if (type) filter.type = type
    if (county) filter.county = { $regex: county, $options: 'i' }
    if (waste) filter.wasteTypes = { $in: [new RegExp(waste, 'i')] }

    const listings = await Marketplace.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name role')

    res.status(200).json({ listings })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   POST /api/marketplace
// @access  Private (collector or admin)
const createListing = async (req, res) => {
  try {
    const { name, type, county, wasteTypes, contact, description } = req.body
    if (!name || !type || !county || !contact) {
      return res.status(400).json({ message: 'Name, type, county, and contact are required.' })
    }
    const listing = await Marketplace.create({
      name, type, county,
      wasteTypes: wasteTypes || [],
      contact, description,
      createdBy: req.user._id,
    })
    res.status(201).json({ message: 'Listing created.', listing })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   DELETE /api/marketplace/:id
// @access  Private (admin or owner)
const deleteListing = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })

    const isOwner = String(listing.createdBy) === String(req.user._id)
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }

    await listing.deleteOne()
    res.status(200).json({ message: 'Listing deleted.' })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

module.exports = { getListings, createListing, deleteListing }
