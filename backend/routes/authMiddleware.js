const admin = require('../config/firebase');

// Middleware to decode Firebase JWT token
const decodeToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (isDevMode) {
            console.log('Development Mode: No token provided, using dev-user.');
            req.user = { uid: 'dev-user-123', email: 'test@university.edu' };
            return next();
        }
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token using Firebase Admin
        // Note: This requires a properly initialized Firebase Admin SDK
        if (admin.apps.length > 0) {
            const decodeValue = await admin.auth().verifyIdToken(token);
            if (decodeValue) {
                req.user = decodeValue;
                return next();
            }
        } else if (isDevMode) {
            console.log('Development Mode: Firebase Admin not initialized, mocking verification.');
            req.user = { uid: 'dev-user-123', email: 'test@university.edu' };
            return next();
        }

        return res.status(401).json({ message: 'Unauthorized: Firebase Admin initialization required or verification failed' });

    } catch (e) {
        console.error('Auth error', e);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = { decodeToken };

