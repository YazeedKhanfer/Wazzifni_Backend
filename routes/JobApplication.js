const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const  verifyToken  = require('../middleware/auth'); 
// const jobPosts = require('../routes/jobPosts')
const JobPost = require('../models/jobPosts')

router.post('/apply-job/:jobId', verifyToken, async (req, res) => {
    const { jobId } = req.params;
    const studentId = req.user.id; // Assuming req.user is set in the verifyToken middleware
  
    try {
      // Check if the student already applied for this job
      const existingApplication = await JobApplication.findOne({ jobId, studentId });
      //console.log(jobId, studentId);
      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied for this job.' });
      }
  
      // Get the managerId from the JobPost
      const jobPost = await JobPost.findById(jobId).select('managerEmail');
      
      
      

      if (!jobPost) {
        return res.status(404).json({ message: 'Job post not found.' });
      }

      const managerEmail = jobPost.managerEmail;
    

      // Create a new job application
      const application = new JobApplication({ jobId, studentId, managerEmail });
      await application.save();
  
      res.status(200).json({ message: 'Application sent successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to apply for job.', error });
    }
  });

  router.get('/job-applications', verifyToken, async (req, res) => {
    
    const managerEmail = req.user.email; 
  
    try {
      
      const applications = await JobApplication.find({ status: 'pending', managerEmail })
        .populate('studentId', 'name major')
        .populate('jobId', 'jobDescription')
        .exec();
        console.log(applications);
  
      res.status(200).json(applications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job applications.', error });
    }
  });

  
router.post('/respond-application', verifyToken, async (req, res) => {
    const { applicationId, status } = req.body;
    const managerEmail = req.user.email; 
  
    try {
      const application = await JobApplication.findById(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }
  
      // Check if the managerEmail matches the one in the application
      if (application.managerEmail !== managerEmail) {
        return res.status(403).json({ message: 'You are not authorized to respond to this application.' });
      }
  
      if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ message: 'Invalid status.' });
      }
  
      application.status = status;
      await application.save();
  
      res.status(200).json({ message: `Application ${status} successfully.` });
    } catch (error) {
      console.error('Error in /respond-application:', error);  // Log the error for debugging
      res.status(500).json({ message: 'Failed to update application status.', error: error.message || error });
    }
  });

  

  
module.exports = router;
