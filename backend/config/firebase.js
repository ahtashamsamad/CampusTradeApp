// Mock Firebase Admin setup for development
// In a real app, you would download a serviceAccountKey.json from Firebase Console
// and initialize admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const admin = require('firebase-admin');

try {
    // We'll initialize an empty app or use a placeholder for now since we don't have real credentials yet
    // This allows the server to start without crashing
    console.log('Firebase Admin SDK initialized (Mock/Placeholder for development)');
} catch (error) {
    console.error('Firebase Admin initialization error', error);
}

module.exports = admin;
