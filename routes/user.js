const express = require('express');
const auth = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const {upload,uploadMiddleware} = require('../middleware/imageUpload')
const User = require('../models/User');
const router = express.Router();
const Notification = require('../models/Notification');


router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server error');
  }
});


router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);  // Ensure it returns JSON
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ msg: 'Server error' });  // Return JSON error message
  }
});



router.post('/update', auth, upload.single("image"), uploadMiddleware , async (req, res) => {
  const { name, universityName, major, location, year, phoneNumber, business } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.name = name || user.name;
    user.universityName = universityName || user.universityName;
    user.major = major || user.major;
    user.location = location || user.location;
    user.year = year || user.year;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.business = business || user.business;
    user.profilePicture=req.fileUrl;

    await user.save();

    res.setHeader('Content-Type', 'application/json');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.get('/history/:recipientId', auth, async (req, res) => {
  const { recipientId } = req.params;

  try {
    const messages = await ChatMessage.find({
      $or: [
        { sender: req.user.id, recipient: recipientId },
        { sender: recipientId, recipient: req.user.id },
      ],
    }).sort({ timestamp: 1 })
    .populate('sender', 'name image')  
    .populate('recipient', 'name image');  

    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


module.exports = router;
