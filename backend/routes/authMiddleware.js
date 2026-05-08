const admin = require('../config/firebase');

// Middleware to decode Firebase JWT token
const decodeToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For development/testing, we might want to bypass auth if no token is provided
        // In production, uncomment the return statement to enforce auth
        console.log('No token provided, but proceeding for development purposes.');
        req.user = { uid: 'dev-user-123', email: 'test@university.edu' };
        return next();

        // return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token using Firebase Admin
        // const decodeValue = await admin.auth().verifyIdToken(token);
        // if (decodeValue) {
        //   req.user = decodeValue;
        //   return next();
        // }

        // Mock successful verification for dev
        console.log('Mock verifying token:', token.substring(0, 10) + '...');
        req.user = { uid: 'dev-user-123', email: 'test@university.edu' };
        return next();

    } catch (e) {
        console.error('Auth error', e);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = { decodeToken };
