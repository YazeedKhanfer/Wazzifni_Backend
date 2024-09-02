const mongoose = require('mongoose');


const StudentRequestSchema = new mongoose.Schema({
    studentId:String,
    studentEmail: String,
    studentName: String,
    studentGender: String,
    studentPicture: {
        type: String,
    },
    location: {
        type: String,
        required: true
    },
    formerExperience: {
        type: String,
        required: true
    },
    availability: {
        type: Map,
        of: String,
        required: true
    }
});

const StudentRequest = mongoose.model('StudentRequest', StudentRequestSchema);
module.exports = StudentRequest;
