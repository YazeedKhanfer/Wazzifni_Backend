const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const router = express.Router();


router.post('/register', validateRegister, async (req, res) => {
  const defaultImage = 'https://firebasestorage.googleapis.com/v0/b/wazzifni-43e95.appspot.com/o/immmm.png?alt=media&token=21ab8263-6a06-4023-b1b0-2822d6b5f941';
  const { email, password, role, name, birthday, gender, universityName, major, location, year, phoneNumber, business, profilePicture } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    user = new User({
      email,
      password,
      role,
      name,
      birthday,
      gender,
      universityName,
      major,
      location,
      year,
      phoneNumber,
      business,
      profilePicture:defaultImage
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role, 
        email: user.email
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});




router.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;
  try {
    //console.log(User);
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Password' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role, 
        email: user.email
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
