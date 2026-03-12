import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
    } else {
        console.warn("Firebase Admin: Project configuration missing. Skipping initialization.");
    }
}

const db = admin.apps.length ? admin.firestore() : (null as any);

export { db };
export default db;

