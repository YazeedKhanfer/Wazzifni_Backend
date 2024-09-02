const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const JobPost = require('../models/jobPosts');
const StudentRequest = require('../models/studentRequests');

// Function to parse the availability object from the database format
const parseAvailability = (availabilityObj) => {
  const availability = {};

  Object.entries(availabilityObj).forEach(([dayName, hours]) => {
    if (typeof hours === 'string' && hours.includes('-')) {
      const [startTime, endTime] = hours.split('-');
      availability[dayName.trim().toLowerCase()] = {
        start: parseTime(startTime.trim()),
        end: parseTime(endTime.trim()),
      };
    } else {
      console.warn(`Invalid hours format for day: ${dayName}, hours: ${hours}`);
    }
  });

  return availability;
};

// Function to parse the time string into minutes since 00:00
const parseTime = (time) => {
  const period = time.slice(-2).toUpperCase();
  let [hours, minutes] = time.slice(0, -2).split(':').map(Number);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  if (!minutes) minutes = 0;

  return hours * 60 + minutes; // Convert to minutes since 00:00 for easy comparison
};

// Function to compare availability
const compareAvailability = (userAvailabilityObj, optionAvailabilityObj) => {
  const userAvailability = parseAvailability(userAvailabilityObj);
  const optionAvailability = parseAvailability(optionAvailabilityObj);
  let score = 0;

  Object.keys(userAvailability).forEach(day => {
    if (optionAvailability[day]) {
      const userStart = userAvailability[day].start;
      const userEnd = userAvailability[day].end;
      const optionStart = optionAvailability[day].start;
      const optionEnd = optionAvailability[day].end;

      // Calculate overlap
      const overlapStart = Math.max(userStart, optionStart);
      const overlapEnd = Math.min(userEnd, optionEnd);

      if (overlapStart < overlapEnd) {
        const overlapMinutes = overlapEnd - overlapStart;
        score += overlapMinutes; // Assign score based on the overlap in minutes
      }
    }
  });

  return score; // The higher the score, the better the match
};

// Function to calculate the total score
const calculateScore = (userRequest, availableOption, user) => {
  let score = 0;

  // Gender Matching
  if (userRequest.gender === availableOption.gender || !availableOption.gender) {
    score += 10; // example score for gender matching
  }

  // Availability Matching
  const availabilityScore = compareAvailability(userRequest.availability, availableOption.availability);
  score += availabilityScore;

  // Experience Matching
  if (userRequest.formerExperience && availableOption.jobDescription) {
    score += compareExperience(userRequest.formerExperience, availableOption.jobDescription);
  }

  // Location Matching
  if (userRequest.location && availableOption.location) {
    const locationScore = compareLocation(userRequest.location, availableOption.location);
    score += locationScore;
  }

  return score;
};
// Function to compare experience
const compareExperience = (userExperience, jobDescription) => {
  const keywords = [
    'female', 'male',
    'cleaner', 'waiter', 'waitress', 'cashier', 'barista', 'manager', 'chef', 'cook', 'kitchen staff',
    'server', 'bartender', 'host', 'hostess', 'supervisor', 'trainer', 'assistant', 'clerk',
    'receptionist', 'secretary', 'administrator', 'support staff', 'cafe', 'restaurant', 'hotel', 'bar',
    'food truck', 'catering', 'banquet', 'hostel', 'lodge', 'chef', 'line cook', 'sous chef', 'pastry chef',
    'baker', 'butcher', 'barista', 'bartender', 'busser', 'dishwasher', 'delivery driver', 'waitstaff',
    'hostess', 'sommelier', 'kitchen assistant', 'burger', 'shawarma', 'pizza', 'sushi', 'tacos', 'burritos',
    'noodles', 'pasta', 'steak', 'grill', 'bbq', 'barbecue', 'fry cook', 'baking', 'pastry', 'dessert', 'cake',
    'bread', 'vegetarian', 'vegan', 'seafood', 'buffet', 'fine dining', 'fast food', 'pub', 'brewery', 'wine',
    'cocktails', 'mocktails', 'coffee', 'tea', 'espresso', 'latte', 'cappuccino', 'software engineer',
    'developer', 'programmer', 'coding', 'java', 'python', 'javascript', 'full stack developer', 
    'backend developer', 'frontend developer', 'devops', 'sysadmin', 'database administrator', 
    'cloud engineer', 'network engineer', 'security analyst', 'data scientist', 'data analyst', 
    'web developer', 'app developer', 'mobile developer', 'qa tester', 'quality assurance', 
    'help desk', 'technical support', 'it support', 'system administrator', 'network administrator', 
    'hardware technician', 'software support', 'it technician', 'it manager', 'it consultant', 
    'data entry', 'office clerk', 'administrative assistant', 'office manager', 'executive assistant',
    'personal assistant', 'scheduler', 'secretary', 'receptionist', 'filing clerk', 'data clerk', 
    'bookkeeper', 'accountant', 'auditor', 'payroll', 'human resources', 'hr manager', 'hr assistant', 
    'legal assistant', 'paralegal', 'consultant', 'project manager', 'office assistant', 
    'sales representative', 'sales manager', 'sales associate', 'sales consultant', 'retail associate',
    'retail manager', 'store manager', 'store associate', 'customer service', 'call center', 
    'customer support', 'client relations', 'client support', 'account manager', 'account executive',
    'business development', 'telemarketer', 'inside sales', 'outside sales', 'door-to-door sales',
    'marketing', 'brand manager', 'sales engineer', 'territory manager', 'advertising', 'delivery', 
    'driver', 'truck driver', 'courier', 'logistics', 'warehouse', 'forklift operator', 'shipping',
    'receiving', 'inventory', 'inventory control', 'packer', 'loader', 'unloader', 'supply chain', 
    'supply chain manager', 'warehouse manager', 'logistics coordinator', 'teacher', 'educator', 
    'tutor', 'instructor', 'professor', 'teaching assistant', 'substitute teacher', 'school administrator',
    'principal', 'school counselor', 'librarian', 'education coordinator', 'special education', 'trainer',
    'training coordinator', 'curriculum developer', 'education consultant', 'construction', 'builder', 
    'laborer', 'carpenter', 'plumber', 'electrician', 'painter', 'welder', 'bricklayer', 'roofer', 'foreman',
    'site supervisor', 'site manager', 'machinist', 'boilermaker', 'crane operator', 'excavator operator',
    'landscaper', 'gardener', 'pest control', 'maintenance', 'nurse', 'registered nurse', 'doctor',
    'physician', 'therapist', 'physical therapist', 'occupational therapist', 'dentist', 'dental hygienist',
    'pharmacist', 'pharmacy technician', 'paramedic', 'emergency medical technician', 'medical assistant',
    'caregiver', 'home health aide', 'nutritionist', 'dietitian', 'personal trainer', 'fitness instructor',
    'yoga instructor', 'massage therapist', 'chiropractor', 'acupuncturist', 'graphic designer', 'designer',
    'illustrator', 'animator', 'video editor', 'photographer', 'videographer', 'content creator', 'copywriter',
    'editor', 'journalist', 'blogger', 'social media manager', 'marketing', 'advertising', 'public relations',
    'communications', 'brand manager', 'event planner', 'artist', 'musician', 'producer', 'dj', 'sound engineer',
    'director', 'screenwriter', 'actor', 'actress', 'security guard', 'security officer', 'janitor', 
    'custodian', 'maintenance worker', 'mechanic', 'auto mechanic', 'engineer', 'civil engineer', 
    'mechanical engineer', 'electrical engineer', 'aerospace engineer', 'biomedical engineer', 
    'chemical engineer', 'environmental engineer', 'industrial engineer', 'manufacturing', 
    'quality control', 'quality assurance', 'lab technician', 'scientist', 'researcher', 'chemist',
    'biologist', 'physicist', 'mathematician', 'statistician'
  ];

 
  const extractKeywords = (text) => {
    text = text.toLowerCase();
    return keywords.filter(keyword => text.includes(keyword));
  };

  const userKeywords = extractKeywords(userExperience);
  const jobKeywords = extractKeywords(jobDescription);

  let score = 0;

  userKeywords.forEach(keyword => {
    if (jobKeywords.includes(keyword)) {
      score += 20; // Assign points for each matching keyword
    }
  });

  // Additional scoring logic based on matching ratio, etc.
  if (userKeywords.length > 0 && jobKeywords.length > 0) {
    const matchRatio = userKeywords.length / jobKeywords.length;
    score += matchRatio * 50;

    if (userKeywords.length === jobKeywords.length) {
      score += 30;
    }

    const missingKeywords = jobKeywords.filter(keyword => !userKeywords.includes(keyword));
    if (missingKeywords.length > 0) {
      score -= missingKeywords.length * 10;
    }
  }

  if (score > 100) {
    score = 100;
  }

  return score;
};

// Location comparison function
const compareLocation = (userLocation, optionLocation) => {
  const normalizedUserLocation = userLocation.toLowerCase();
  const normalizedOptionLocation = optionLocation.toLowerCase();

  if (normalizedUserLocation === normalizedOptionLocation) {
    return 20;
  } else if (normalizedOptionLocation.includes(normalizedUserLocation) || normalizedUserLocation.includes(normalizedOptionLocation)) {
    return 10;
  } else {
    return 0;
  }
};

// Route to rank jobs or requests
router.post('/rank', auth, async (req, res) => {
  const { selectedRequestId } = req.body;
  const user = req.user;

  try {
    let rankedList = [];

    if (user.role === 'University Student') {
      const userRequest = await StudentRequest.findById(selectedRequestId).lean(); // Use lean() to return plain objects
      if (!userRequest) {
        return res.status(404).json({ msg: 'Request not found' });
      }

      const availableJobs = await JobPost.find().lean();

      rankedList = availableJobs.map(job => {
        const score = calculateScore(userRequest, job, user);
        return { job, score };
      });

    } else if (user.role === 'Business Manager') {
      const userJob = await JobPost.findById(selectedRequestId).lean();
      if (!userJob) {
        console.error(`Job not found for ID: ${selectedRequestId}`);
        return res.status(404).json({ msg: 'Job not found' });
      }

      const availableRequests = await StudentRequest.find().lean();

      rankedList = availableRequests.map(request => {
        const score = calculateScore(userJob, request, user);
        return { request, score };
      });
    }

    rankedList.sort((a, b) => b.score - a.score);

    res.json(rankedList);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;