import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Parse JSON from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local fallback: read JSON file from disk
  const serviceAccountPath = path.join(__dirname, "services", "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase serviceAccountKey.json not found locally!");
  }
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
}

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export Firestore
const db = admin.firestore();

export { db, admin };
