const express = require('express')
const router = express.Router()
const {
  createIssue, getMyIssues, getMyAnalytics,
  getAllIssues, getCollectorIssues,
  claimIssue, updateCollectorProgress,
  updateIssueStatus, getTimeline,
  deleteIssue, getStats,
} = require('../controllers/issueController')
const { protect, adminOnly } = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware')

// Citizen
router.post('/', protect, upload.single('image'), createIssue)
router.get('/my', protect, getMyIssues)
router.get('/my/analytics', protect, getMyAnalytics)

// Collector
router.get('/collector', protect, getCollectorIssues)
router.patch('/:id/claim', protect, claimIssue)
router.patch('/:id/progress', protect, updateCollectorProgress)

// Shared — timeline
router.get('/:id/timeline', protect, getTimeline)

// Admin
router.get('/', protect, adminOnly, getAllIssues)
router.get('/stats', protect, adminOnly, getStats)
router.patch('/:id/status', protect, adminOnly, updateIssueStatus)
router.delete('/:id', protect, adminOnly, deleteIssue)

module.exports = router
