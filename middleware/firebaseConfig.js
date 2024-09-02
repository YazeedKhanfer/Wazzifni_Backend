const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.resolve('firebaseServiceAccount.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  storageBucket: 'wazzifni-43e95.appspot.com', // Your Firebase Storage bucket name
});

const bucket = admin.storage().bucket();

module.exports = bucket;


