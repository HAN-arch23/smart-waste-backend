const mongoose = require('mongoose')

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['reported', 'assigned', 'collected', 'recycled', 'resolved', 'rejected'],
    required: true,
  },
  note: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
})

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Overflowing Bin', 'Illegal Dumping', 'Missed Collection', 'Hazardous Waste', 'Blocked Drain', 'Other'],
    },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'collected', 'recycled', 'resolved', 'rejected'],
      default: 'pending',
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },

    // Traceability timeline
    timeline: [timelineEventSchema],
  },
  { timestamps: true }
)

// Auto-add first timeline event on creation
issueSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({ status: 'reported', note: 'Issue reported by citizen.' })
  }
  next()
})

module.exports = mongoose.model('Issue', issueSchema)
