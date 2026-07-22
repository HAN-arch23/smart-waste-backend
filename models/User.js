const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: '' },
    county: { type: String, default: '' },
    role: {
      type: String,
      enum: ['citizen', 'collector', 'admin'],
      default: 'citizen',
    },
    // Collector-specific
    wasteTypesAccepted: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)
