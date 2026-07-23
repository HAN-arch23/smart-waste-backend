const express = require('express')
const cors = require('cors')
const path = require('path')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean)
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/issues', require('./routes/issueRoutes'))
app.use('/api/marketplace', require('./routes/marketplaceRoutes'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartWaste API is running 🟢' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})