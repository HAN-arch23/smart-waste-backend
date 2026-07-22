const dotenv = require('dotenv')
const connectDB = require('./config/db')
const User = require('./models/User')

dotenv.config()

const seed = async () => {
  await connectDB()

  // Admin
  const adminExists = await User.findOne({ email: 'admin@smartwaste.go.ke' })
  if (!adminExists) {
    await User.create({
      name: 'System Admin', email: 'admin@smartwaste.go.ke',
      password: 'Admin@1234', role: 'admin', county: 'Nairobi',
    })
    console.log('✅ Admin created: admin@smartwaste.go.ke / Admin@1234')
  } else {
    console.log('ℹ️  Admin already exists.')
  }

  // Collector
  const collectorExists = await User.findOne({ email: 'collector@smartwaste.go.ke' })
  if (!collectorExists) {
    await User.create({
      name: 'Demo Collector', email: 'collector@smartwaste.go.ke',
      password: 'Collector@1234', role: 'collector', county: 'Nairobi',
      wasteTypesAccepted: ['Plastic', 'Paper', 'Glass'],
    })
    console.log('✅ Collector created: collector@smartwaste.go.ke / Collector@1234')
  } else {
    console.log('ℹ️  Collector already exists.')
  }

  console.log('\n⚠️  Change these passwords after first login!')
  process.exit(0)
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })
