const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const StudentRequest = require('../models/studentRequests');
const JobPost = require('../models/jobPosts');
const auth = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose');

// Send a new message
router.post('/send', auth, async (req, res) => {
  const { contextId, message } = req.body;
   console.log(contextId);
  // console.log("hi");

  try {
    let recipientId;


    // Log the received contextId
    console.log('Received contextId:', contextId);

    // Check if the context is a student request or job post
    const request = await StudentRequest.findById(contextId);
    //console.log('Request:',request);
    const job = await JobPost.findById(contextId);
    //console.log('Job:',job);

    if (request) {
      recipientId = request.studentId; // Use student ID as recipient ID
    } else if (job) {
      recipientId = job.managerId; // Use manager ID as recipient ID
    } else {
      return res.status(404).json({ msg: 'Request or Job not found' });
    }

    console.log('Recipient ID:', recipientId);

    if (!recipientId) {
      return res.status(400).json({ msg: 'Recipient ID is required' });
    }

    const newMessage = new ChatMessage({
      sender: req.user.id,
      recipient: recipientId,
      message,
      contextId, // This helps to keep track of which job or request this message belongs to
    });

    await newMessage.save();
    res.json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get chat history between two users
router.get('/history/:contextId', auth, async (req, res) => {
  const { contextId } = req.params;
  console.log('ContextId:', contextId);
  console.log('UserId:', req.user.id);

  try {
    const messages = await ChatMessage.find({
      contextId,
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
      ],
    }).sort({ timestamp: 1 });
   console.log('messages:', messages);
    // console.log('Sender:', sender);
    // console.log('Recipient:', recipient);

    //res.json(messages);
    // console.log(sender);
    // console.log(recipient);

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Get chat history between the current user and a specific other user
router.get('/historyy/:otherUserId', auth, async (req, res) => {
  const { otherUserId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    const messages = await ChatMessage.find({
      $or: [
        { sender: req.user.id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user.id },
      ],
    }).populate('recipient', 'name').populate('sender', 'name');

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Get list of all chats for the current user
router.get('/list', auth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
      ],
    }).populate('recipient', 'name').populate('sender', 'name');

    // Group messages by contextId (i.e., job or request)
    const chats = messages.reduce((acc, message) => {
      if (!acc[message.contextId]) {
        acc[message.contextId] = {
          contextId: message.contextId,
          messages: [],
          participant: message.sender.id === req.user.id ? message.recipient : message.sender
        };
      }
      acc[message.contextId].messages.push(message);
      return acc;
    }, {});

    res.json(Object.values(chats));
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
