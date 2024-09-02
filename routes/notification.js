const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');  // Assuming a Notification model

// Get notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);  // Return notifications as JSON
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Mark a specific notification as read
router.put('/read/:id', auth, async (req, res) => {
    try {
      const notification = await Notification.findById(req.params.id);
  
      if (!notification) {
        return res.status(404).json({ msg: 'Notification not found' });
      }
  
      notification.read = true;
      await notification.save();
  
      res.json({ msg: 'Notification marked as read' });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      res.status(500).send('Server error');
    }
  });

  router.put('/mark-as-read', auth, async (req, res) => {
    try {
      const result = await Notification.updateMany(
        { userId: req.user.id, read: false },
        { $set: { read: true } }
      );
  
      if (result.nModified === 0) {
        return res.status(404).json({ msg: 'No unread notifications found' });
      }
  
      res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      res.status(500).send('Server error');
    }
  });
  
  module.exports = router;