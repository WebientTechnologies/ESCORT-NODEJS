// firebase-config.js
const admin = require("firebase-admin");
const serviceAccount = require("../escort-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
