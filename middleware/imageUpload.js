const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
const bucket = require('./firebaseConfig.js');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadMiddleware = function(req, res, next) {
  try {
    console.log(req.file);
    if (!req.file) {
      //  res.status(400).json("No file uploaded.");
      console.log('hello');
      return next();
    }

    const file = req.file;
    const uniqueFilename = uuid.v4() + path.extname(file.originalname);

    const fileUpload = bucket.file(uniqueFilename);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on('error', function(err) {
      console.error(err);
      return res.status(500).send('Failed to upload to Firebase Storage.');
    });

    stream.on('finish', function() {
      fileUpload.makePublic().then(function() {
        // Get the file URL
        const publicUrl = 'https://storage.googleapis.com/' + bucket.name + '/' + fileUpload.name;

        // Attach the file URL to the request object
        req.fileUrl = publicUrl;
        next(); // Call the next middleware or route handler
      }).catch(function(error) {
        console.error(error);
        return res.status(500).send('Failed to store file URL.');
      });
    });

    stream.end(file.buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Something went wrong.');
  }
};

module.exports = { upload: upload, uploadMiddleware: uploadMiddleware };
