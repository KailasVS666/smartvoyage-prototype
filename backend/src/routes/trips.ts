import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import authMiddleware from '../middleware/auth';

const router = Router();

// DELETE /trips/:tripId - Delete a trip, and if it has a groupId, delete the group (and all group trips)
router.delete('/:tripId', authMiddleware, async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const requesterUid = req.user?.uid;
  console.log(`[DELETE /trips/${tripId}] Requested by UID:`, requesterUid);
  if (!tripId || !requesterUid) {
    return res.status(400).json({ error: 'Missing tripId or user not authenticated' });
  }
  try {
    const tripRef = admin.firestore().collection('trips').doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const tripData = tripSnap.data();
    // Only allow owner or group admin/editor to delete
    let canDelete = tripData.userId === requesterUid;
    if (tripData.groupId) {
      const groupRef = admin.firestore().collection('groups').doc(tripData.groupId);
      const groupSnap = await groupRef.get();
      if (groupSnap.exists) {
        const groupData = groupSnap.data();
        if (groupData && Array.isArray(groupData.members)) {
          const member = groupData.members.find((m: any) => m.uid === requesterUid);
          if (member && (member.role === 'admin' || member.role === 'editor')) {
            canDelete = true;
          }
        }
      }
    }
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this trip' });
    }
    // If trip has a groupId, delete the group (which will cascade to delete all group trips)
    if (tripData.groupId) {
      const groupId = tripData.groupId;
      const groupRef = admin.firestore().collection('groups').doc(groupId);
      // Delete all trips with this groupId
      const tripsQuery = await admin.firestore().collection('trips').where('groupId', '==', groupId).get();
      for (const doc of tripsQuery.docs) {
        await doc.ref.delete();
        console.log(`[DELETE /trips/${tripId}] Deleted group trip:`, doc.id);
      }
      // Delete the group
      await groupRef.delete();
      console.log(`[DELETE /trips/${tripId}] Deleted group:`, groupId);
    } else {
      // Just delete the trip
      await tripRef.delete();
      console.log(`[DELETE /trips/${tripId}] Deleted solo trip.`);
    }
    return res.json({ success: true, message: 'Trip (and group if applicable) deleted' });
  } catch (error: any) {
    console.error('Error deleting trip:', error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message || 'Failed to delete trip' });
  }
});

export default router; 