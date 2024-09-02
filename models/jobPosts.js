const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobPostSchema = new mongoose.Schema({
  managerId:{
    type: String,

  },
    managerEmail: {
        type: String,
    },
    managerName: {
        type: String,
    },
    managerPicture: {
      type: String,
  },
    location: {
        type: String,
        required: true,
    },
    jobDescription: {
        type: String,
        required: true,
    },
    availability: {
        type: Map,
        of: String,
        required: true,
      },

});

const JobPost = mongoose.model('JobPost', JobPostSchema);
module.exports = JobPost;
