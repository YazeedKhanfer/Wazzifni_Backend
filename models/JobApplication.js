const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'JobPost',
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  managerEmail: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
