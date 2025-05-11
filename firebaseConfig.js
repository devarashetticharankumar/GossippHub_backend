const admin = require("firebase-admin");

// Load the service account key JSON file
const serviceAccount = require("./config/gossiphub-f8dd3-firebase-adminsdk-fbsvc-fb0d54ed5d.json"); // Replace with the path to your service account key

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gossiphub-f8dd3.firebasestorage.app", // Your storage bucket URL from Firebase Console
});

const bucket = admin.storage().bucket();

module.exports = bucket;
