const admin = require('../config/firebase');
const db = admin.firestore();

const usersCollection = db.collection('users');
const listingsCollection = db.collection('listings');
const reportsCollection = db.collection('reports');
const activityCollection = db.collection('activity_logs');

const toIsoString = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp.toMillis) return new Date(timestamp.toMillis()).toISOString();
  return new Date(timestamp).toISOString();
};

exports.getStats = async (req, res) => {
  try {
    const [usersSnap, listingsSnap, pendingSnap, reportsSnap] = await Promise.all([
      usersCollection.get(),
      listingsCollection.get(),
      listingsCollection.where('status', '==', 'pending').get(),
      reportsCollection.get(),
    ]);

    const activeReports = reportsSnap.docs.filter((doc) => {
      const status = doc.data()?.status || 'pending';
      return status !== 'resolved' && status !== 'dismissed';
    }).length;

    res.json({
      totalUsers: usersSnap.size,
      totalListings: listingsSnap.size,
      pendingApprovals: pendingSnap.size,
      activeReports,
    });
  } catch (error) {
    console.error('Admin getStats error', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message || error });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const recentEvents = [];

    const activitySnap = await activityCollection.orderBy('createdAt', 'desc').limit(5).get();
    if (!activitySnap.empty) {
      activitySnap.forEach((doc) => {
        const data = doc.data();
        recentEvents.push({
          id: doc.id,
          title: data.title || 'Activity',
          subtitle: data.subtitle || '',
          date: toIsoString(data.createdAt),
          type: data.type || 'activity',
        });
      });
      return res.json({ activity: recentEvents });
    }

    const reportsSnap = await reportsCollection.orderBy('reportedAt', 'desc').limit(5).get();
    reportsSnap.forEach((doc) => {
      const data = doc.data();
      recentEvents.push({
        id: doc.id,
        title: 'Report submitted',
        subtitle: `${data.reporterName || 'A user'} reported ${data.reportedUserId || data.reportedItemId || 'an item'}`,
        date: toIsoString(data.reportedAt || data.createdAt),
        type: 'report',
      });
    });

    res.json({ activity: recentEvents });
  } catch (error) {
    console.error('Admin getActivity error', error);
    res.status(500).json({ message: 'Error fetching activity feed', error: error.message || error });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const queryValue = (req.query.search || '').toString().trim().toLowerCase();
    const snapshot = await usersCollection.get();
    const users = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((user) => {
        if (!queryValue) return true;
        const name = (user.name || user.fullName || '').toString().toLowerCase();
        const email = (user.email || '').toString().toLowerCase();
        return name.includes(queryValue) || email.includes(queryValue);
      })
      .map((user) => ({
        id: user.id,
        name: user.name || user.fullName || 'Unknown',
        email: user.email || '',
        university: user.university || user.campus || '',
        memberSince: toIsoString(user.createdAt) || user.memberSince || null,
        status: user.status === 'banned' || user.isSuspended ? 'banned' : 'active',
        isVerified: !!user.isVerified,
        verificationStatus: user.verificationStatus || 'unknown',
        role: user.role || 'user',
        avatar: user.avatar || null,
      }));

    res.json({ users });
  } catch (error) {
    console.error('Admin getUsers error', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message || error });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userDoc.data();
    res.json({
      id: userDoc.id,
      name: user.name || user.fullName || 'Unknown',
      email: user.email || '',
      university: user.university || user.campus || '',
      memberSince: toIsoString(user.createdAt) || user.memberSince || null,
      status: user.status === 'banned' || user.isSuspended ? 'banned' : 'active',
      isVerified: !!user.isVerified,
      verificationStatus: user.verificationStatus || 'unknown',
      role: user.role || 'user',
      avatar: user.avatar || null,
      phone: user.phone || '',
      department: user.department || '',
      major: user.major || '',
      program: user.program || '',
      semester: user.semester || '',
      session: user.session || '',
      rollNumber: user.rollNumber || '',
      preferences: user.preferences || {},
    });
  } catch (error) {
    console.error('Admin getUser error', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message || error });
  }
};

exports.userAction = async (req, res) => {
  try {
    const userId = req.params.id;
    const { action } = req.body;
    const userDocRef = usersCollection.doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch (action) {
      case 'ban':
        await userDocRef.update({ status: 'banned', isSuspended: true });
        return res.json({ message: 'User banned successfully' });
      case 'unban':
        await userDocRef.update({ status: 'active', isSuspended: false });
        return res.json({ message: 'User unbanned successfully' });
      case 'verify':
        await userDocRef.update({ verificationStatus: 'verified', isVerified: true, bzu_verified: true, verifiedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'User verified successfully' });
      case 'delete':
        await admin.auth().deleteUser(userId).catch(() => null);
        await userDocRef.delete();
        return res.json({ message: 'User deleted successfully' });
      default:
        return res.status(400).json({ message: 'Unknown user action' });
    }
  } catch (error) {
    console.error('Admin userAction error', error);
    res.status(500).json({ message: 'Error applying user action', error: error.message || error });
  }
};

exports.getListings = async (req, res) => {
  try {
    const status = (req.query.status || 'all').toString();
    let query = listingsCollection;
    if (status !== 'all') {
      query = listingsCollection.where('status', '==', status);
    }
    const snapshot = await query.get();
    const listings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || data.name || 'Untitled',
        price: data.price || 0,
        sellerName: data.sellerName || data.sellerId || 'Unknown seller',
        sellerId: data.sellerId || null,
        category: data.category || 'Uncategorized',
        condition: data.condition || 'Unknown',
        status: data.status || 'pending',
        isSold: !!data.isSold || data.status === 'sold',
        images: Array.isArray(data.images) ? data.images : data.imageUrl ? [data.imageUrl] : [],
        description: data.description || data.summary || '',
        createdAt: toIsoString(data.createdAt) || null,
      };
    });

    res.json({ listings });
  } catch (error) {
    console.error('Admin getListings error', error);
    res.status(500).json({ message: 'Error fetching listings', error: error.message || error });
  }
};

exports.listingAction = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { action } = req.body;
    const listingRef = listingsCollection.doc(listingId);
    const listingDoc = await listingRef.get();
    if (!listingDoc.exists) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    switch (action) {
      case 'approve':
        await listingRef.update({ status: 'approved', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Listing approved successfully' });
      case 'reject':
        await listingRef.update({ status: 'rejected', reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Listing rejected successfully' });
      case 'sold':
        await listingRef.update({ status: 'sold', isSold: true, isAvailable: false, soldAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Listing marked as sold' });
      case 'delete':
        await listingRef.delete();
        return res.json({ message: 'Listing deleted successfully' });
      default:
        return res.status(400).json({ message: 'Unknown listing action' });
    }
  } catch (error) {
    console.error('Admin listingAction error', error);
    res.status(500).json({ message: 'Error applying listing action', error: error.message || error });
  }
};

exports.getReports = async (req, res) => {
  try {
    const snapshot = await reportsCollection.orderBy('reportedAt', 'desc').get();
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        reportedUserId: data.reportedUserId || null,
        reportedItemId: data.reportedItemId || null,
        reportedUserName: data.reportedUserName || null,
        reportedItemTitle: data.reportedItemTitle || null,
        reason: data.reason || 'Not specified',
        reporterName: data.reporterName || 'Anonymous',
        date: toIsoString(data.reportedAt) || toIsoString(data.createdAt) || null,
        status: data.status || 'pending',
      };
    });

    res.json({ reports });
  } catch (error) {
    console.error('Admin getReports error', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message || error });
  }
};

exports.reportAction = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { action } = req.body;
    const reportRef = reportsCollection.doc(reportId);
    const reportDoc = await reportRef.get();
    if (!reportDoc.exists) {
      return res.status(404).json({ message: 'Report not found' });
    }
    const report = reportDoc.data();

    switch (action) {
      case 'dismiss':
        await reportRef.update({ status: 'dismissed', resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Report dismissed successfully' });
      case 'ban_user':
        if (report?.reportedUserId) {
          await usersCollection.doc(report.reportedUserId).update({ status: 'banned', isSuspended: true });
        }
        await reportRef.update({ status: 'resolved', resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Reported user banned and report resolved' });
      case 'remove_listing':
        if (report?.reportedItemId) {
          await listingsCollection.doc(report.reportedItemId).delete();
        }
        await reportRef.update({ status: 'resolved', resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Reported listing removed and report resolved' });
      default:
        return res.status(400).json({ message: 'Unknown report action' });
    }
  } catch (error) {
    console.error('Admin reportAction error', error);
    res.status(500).json({ message: 'Error applying report action', error: error.message || error });
  }
};

exports.getVerifications = async (req, res) => {
  try {
    const snapshot = await usersCollection.where('verificationStatus', '==', 'pending').get();
    const verifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.fullName || 'Unknown',
        email: data.email || '',
        rollNumber: data.rollNumber || '',
        department: data.department || '',
        program: data.program || '',
        semester: data.semester || '',
        session: data.session || '',
        campus: data.campus || data.university || '',
        verificationStatus: data.verificationStatus || 'pending',
        university: data.university || data.campus || '',
        submissionDate: toIsoString(data.verificationSubmittedAt || data.updatedAt || data.createdAt) || null,
        image: data.verificationImageUrl || data.idImageUrl || data.studentIdImage || data.avatar || null,
      };
    });
    res.json({ pendingVerifications: verifications });
  } catch (error) {
    console.error('Admin getVerifications error', error);
    res.status(500).json({ message: 'Error fetching verifications', error: error.message || error });
  }
};

exports.verificationAction = async (req, res) => {
  try {
    const userId = req.params.id;
    const { action } = req.body;
    const userRef = usersCollection.doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Verification record not found' });
    }

    switch (action) {
      case 'approve':
        await userRef.update({ verificationStatus: 'verified', isVerified: true, bzu_verified: true, verifiedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Student verification approved' });
      case 'reject':
        await userRef.update({ verificationStatus: 'rejected', rejectedAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ message: 'Student verification rejected' });
      default:
        return res.status(400).json({ message: 'Unknown verification action' });
    }
  } catch (error) {
    console.error('Admin verificationAction error', error);
    res.status(500).json({ message: 'Error processing verification action', error: error.message || error });
  }
};
