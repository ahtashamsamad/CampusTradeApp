const admin = require('../config/firebase');
const db = admin.firestore();

const requireAdmin = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized: admin authentication required' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ message: 'Forbidden: admin account not found' });
    }

    const data = userDoc.data();
    if (data?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin role required' });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error', error);
    res.status(500).json({ message: 'Error validating admin role', error: error.message || error });
  }
};

module.exports = { requireAdmin };
