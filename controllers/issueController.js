const Issue = require('../models/Issue')

// @route   POST /api/issues
// @access  Private (citizen)
const createIssue = async (req, res) => {
  try {
    const { title, category, location, description } = req.body
    if (!title || !category || !location) {
      return res.status(400).json({ message: 'Title, category, and location are required.' })
    }
    const issue = await Issue.create({
      title, category, location, description,
      image: req.file ? req.file.filename : null,
      reportedBy: req.user._id,
    })
    await issue.populate('reportedBy', 'name email')
    res.status(201).json({ message: 'Issue reported successfully.', issue })
  } catch (error) {
    console.error('Create issue error:', error)
    res.status(500).json({ message: 'Server error while creating issue.' })
  }
}

// @route   GET /api/issues/my
// @access  Private (citizen)
const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name')
    res.status(200).json({ issues })
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching issues.' })
  }
}

// @route   GET /api/issues/my/analytics
// @access  Private (citizen)
const getMyAnalytics = async (req, res) => {
  try {
    const userId = req.user._id
    const [total, pending, resolved, collected, recycled, byCategory] = await Promise.all([
      Issue.countDocuments({ reportedBy: userId }),
      Issue.countDocuments({ reportedBy: userId, status: 'pending' }),
      Issue.countDocuments({ reportedBy: userId, status: 'resolved' }),
      Issue.countDocuments({ reportedBy: userId, status: 'collected' }),
      Issue.countDocuments({ reportedBy: userId, status: 'recycled' }),
      Issue.aggregate([
        { $match: { reportedBy: userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    res.status(200).json({ total, pending, resolved, collected, recycled, byCategory, resolutionRate })
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching analytics.' })
  }
}

// @route   GET /api/issues
// @access  Private (admin)
const getAllIssues = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status) filter.status = status
    if (category) filter.category = category
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    const skip = (Number(page) - 1) * Number(limit)
    const [issues, total] = await Promise.all([
      Issue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('reportedBy', 'name email county')
        .populate('assignedTo', 'name'),
      Issue.countDocuments(filter),
    ])
    res.status(200).json({ issues, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching issues.' })
  }
}

// @route   GET /api/issues/collector
// @access  Private (collector) — open/assigned issues
const getCollectorIssues = async (req, res) => {
  try {
    const { status } = req.query
    const filter = {}
    if (status === 'mine') {
      filter.assignedTo = req.user._id
    } else {
      filter.status = 'pending'
    }
    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name county')
      .populate('assignedTo', 'name')
    res.status(200).json({ issues })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   PATCH /api/issues/:id/claim
// @access  Private (collector)
const claimIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ message: 'Issue not found.' })
    if (issue.status !== 'pending') return res.status(400).json({ message: 'Issue is no longer available.' })

    issue.status = 'assigned'
    issue.assignedTo = req.user._id
    issue.timeline.push({
      status: 'assigned',
      note: `Claimed by collector ${req.user.name}.`,
      updatedBy: req.user._id,
    })
    await issue.save()
    res.status(200).json({ message: 'Issue claimed.', issue })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   PATCH /api/issues/:id/progress
// @access  Private (collector) — move to collected or recycled
const updateCollectorProgress = async (req, res) => {
  try {
    const { status, note } = req.body
    const allowed = ['collected', 'recycled']
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status for collector.' })

    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ message: 'Issue not found.' })
    if (String(issue.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your assigned issue.' })
    }

    issue.status = status
    issue.timeline.push({
      status,
      note: note || `Marked as ${status} by collector.`,
      updatedBy: req.user._id,
    })
    await issue.save()
    res.status(200).json({ message: `Status updated to ${status}.`, issue })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   PATCH /api/issues/:id/status
// @access  Private (admin)
const updateIssueStatus = async (req, res) => {
  try {
    const { status, note } = req.body
    const valid = ['pending', 'assigned', 'collected', 'recycled', 'resolved', 'rejected']
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status.' })

    const issue = await Issue.findById(req.params.id)
    if (!issue) return res.status(404).json({ message: 'Issue not found.' })

    issue.status = status
    if (status === 'resolved') issue.resolvedAt = new Date()
    issue.timeline.push({
      status,
      note: note || `Status updated to ${status} by admin.`,
      updatedBy: req.user._id,
    })
    await issue.save()
    res.status(200).json({ message: 'Status updated.', issue })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   GET /api/issues/:id/timeline
// @access  Private
const getTimeline = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('timeline.updatedBy', 'name role')
      .populate('reportedBy', 'name')
    if (!issue) return res.status(404).json({ message: 'Issue not found.' })
    res.status(200).json({ timeline: issue.timeline, issue })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   DELETE /api/issues/:id
// @access  Private (admin)
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id)
    if (!issue) return res.status(404).json({ message: 'Issue not found.' })
    res.status(200).json({ message: 'Issue deleted.' })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

// @route   GET /api/issues/stats
// @access  Private (admin)
const getStats = async (req, res) => {
  try {
    const [total, pending, inProgress, resolved, rejected, byCategory] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'pending' }),
      Issue.countDocuments({ status: { $in: ['assigned', 'collected', 'recycled'] } }),
      Issue.countDocuments({ status: 'resolved' }),
      Issue.countDocuments({ status: 'rejected' }),
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])
    res.status(200).json({ total, pending, inProgress, resolved, rejected, byCategory })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
}

module.exports = {
  createIssue, getMyIssues, getMyAnalytics,
  getAllIssues, getCollectorIssues,
  claimIssue, updateCollectorProgress,
  updateIssueStatus, getTimeline,
  deleteIssue, getStats,
}
