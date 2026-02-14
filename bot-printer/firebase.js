const admin = require("firebase-admin");
const config = require("./config");
const fs = require("fs");

// Load service account
if (!fs.existsSync(config.firebase.serviceAccountPath)) {
  console.error(
    `[Firebase] Service account key not found at: ${config.firebase.serviceAccountPath}`,
  );
  console.error(
    "  Download it from Firebase Console > Project Settings > Service Accounts > Generate new private key",
  );
  process.exit(1);
}

const serviceAccount = require(config.firebase.serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log(`[Firebase] Connected to project: ${serviceAccount.project_id}`);

module.exports = { db, admin };
