const admin = require('firebase-admin');

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) return;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT');
      return;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin initialized using application default credentials');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
};

initFirebaseAdmin();
module.exports = admin;
