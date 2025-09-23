const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

function getFirestore() {
  // Use GOOGLE_APPLICATION_CREDENTIALS path if present else ./legal-firebase.json in backend_2
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', '..', 'legal-firebase.json');
  const projectId = process.env.GCP_PROJECT_ID;
  const settings = projectId ? { projectId, keyFilename: credsPath } : { keyFilename: credsPath };
  const db = new Firestore(settings);
  return db;
}

module.exports = { getFirestore };

