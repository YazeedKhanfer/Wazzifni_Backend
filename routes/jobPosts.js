const express = require('express');
const JobPost = require('../models/jobPosts');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/createJob', auth, async (req, res) => {
  const { location, jobDescription, availability } = req.body;
  try {
    if (req.user.role !== 'Business Manager') {
      return res.status(403).json({ msg: 'Access denied: only Business Managers can create job posts' });
    }

    const user = await User.findById(req.user.id);
    const managerId=user.id;
    const managerEmail = user.email;
    const managerName = user.name;
    const managerPicture=user.profilePicture;

    const newJobPost = new JobPost({
      managerId,
      managerEmail,
      managerName,
      managerPicture,
      location,
      jobDescription,
      availability,
    });

    await newJobPost.save();
    res.status(201).json(newJobPost);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});
router.get('/myJobsOnly', auth, async (req, res) => {
  try {
    const jobPosts = await JobPost.find({ managerId: req.user.id });
    res.json(jobPosts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.get('/myJobs', auth, async (req, res) => {
  try {
    const jobPosts = await JobPost.find();
    res.json(jobPosts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).send('Job not found');
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.put('/updateJob/:id', auth, async (req, res) => {
  const { location, jobDescription, availability } = req.body;
  try {
    let job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).send('Job not found');

    job.location = location || job.location;
    job.jobDescription = jobDescription || job.jobDescription;
    job.availability = availability || job.availability;

    await job.save();
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.delete('/deleteJob/:id', auth, async (req, res) => {
  try {
    const job = await JobPost.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).send('Job not found');
    res.json({ msg: 'Job deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
