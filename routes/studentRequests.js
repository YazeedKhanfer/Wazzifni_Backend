const express = require('express');
const StudentReq = require('../models/studentRequests');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/createRequest', auth, async (req, res) => {
  const { location, formerExperience, availability } = req.body;
  try {
    if (req.user.role !== 'University Student') {
      return res.status(403).json({ msg: 'Access denied: only University Students can create requests' });
    }

    const user = await User.findById(req.user.id);
    const studentId=user.id;

    const studentEmail = user.email;
    const studentName = user.name;
    const studentGender = user.gender;
    const studentPicture = user.profilePicture;

    const newStudentReq = new StudentReq({
      studentId,
      studentEmail,
      studentName,
      studentPicture,
      studentGender,
      location,
      formerExperience,
      availability,
    });

    await newStudentReq.save();
    res.status(201).json(newStudentReq);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});
router.get('/myRequestsOnly', auth, async (req, res) => {
  try {
    const studentRequests = await StudentReq.find({ studentId: req.user.id });
    res.json(studentRequests);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.get('/myRequests', auth, async (req, res) => {
  try {
    const studentRequest = await StudentReq.find();
    res.json(studentRequest);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.get('/myRequests/:Id', auth, async (req, res) => {
  try {
    const StudentRequest = await StudentReq.findById(req.params.id);
    if (!StudentRequest) return res.status(404).send('Request not found');
    res.json(StudentRequest);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});



router.put('/updateRequest/:id', auth, async (req, res) => {
  const { location, formerExperience, availability } = req.body;
  try {
    let request = await StudentReq.findById(req.params.id);
    if (!request) return res.status(404).send('Request not found');

    request.location = location || request.location;
    request.formerExperience = formerExperience || request.formerExperience;
    request.availability = availability || request.availability;

    await request.save();
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.delete('/deleteRequest/:id', auth, async (req, res) => {
  try {
    const request = await StudentReq.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).send('Request not found');
    res.json({ msg: 'Request deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
