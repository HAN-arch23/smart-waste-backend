const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone, county } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const user = await User.create({ name, email, password, phone, county })
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        county: user.county,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error during registration.' })
  }
}

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = generateToken(user._id)

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        county: user.county,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login.' })
  }
}

// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({ user: req.user })
}

module.exports = { register, login, getMe }
