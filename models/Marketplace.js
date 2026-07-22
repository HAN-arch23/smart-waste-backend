const mongoose = require('mongoose')

const marketplaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['collector', 'recycler'],
      required: true,
    },
    county: { type: String, required: true },
    wasteTypes: [{ type: String }],
    contact: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Marketplace', marketplaceSchema)
