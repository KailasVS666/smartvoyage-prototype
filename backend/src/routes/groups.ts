import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import { Group, GroupMember } from '../types/group';
import authMiddleware from '../middleware/auth';

const router = Router();

// POST /groups/create
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  const { name, memberEmails, tripId } = req.body as {
    name: string;
    memberEmails: string[];
    tripId?: string;
  };

  if (!name || !Array.isArray(memberEmails)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Lookup each email to get uid
    const memberLookups = await Promise.all(
      memberEmails.map(async (email) => {
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          return { uid: userRecord.uid, email };
        } catch (err) {
          return { uid: null, email };
        }
      })
    );

    // Check for any not found
    const notFound = memberLookups.filter((m) => !m.uid);
    if (notFound.length > 0) {
      return res.status(404).json({ error: `User(s) not found: ${notFound.map((m) => m.email).join(', ')}` });
    }

    // 2. Build members array: creator is admin, others are editors (viewers can be added in the future)
    const creatorUid = req.user!.uid;
    const members: GroupMember[] = [
      { uid: creatorUid, role: 'admin' },
      ...memberLookups
        .filter((m) => m.uid && m.uid !== creatorUid)
        .map((m) => ({ uid: m.uid!, role: 'editor' as const })),
      // To add a viewer in the future: { uid: someUid, role: 'viewer' as const }
    ];

    // 3. Create group doc in Firestore atomically with all fields
    const db = admin.firestore();
    const groupRef = db.collection('groups').doc();
    const groupId = groupRef.id;
    const groupData: Group = {
      groupId,
      name,
      createdBy: creatorUid,
      members,
      ...(tripId ? { tripId } : {}),
    };
    await groupRef.set(groupData); // atomic write with all fields

    return res.status(201).json({ groupId });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return res.status(500).json({ error: error.message || 'Failed to create group' });
  }
});

// DELETE /groups/:groupId - Only admin can delete group
router.delete('/:groupId', authMiddleware, async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const requesterUid = req.user?.uid;
  console.log(`[DELETE /groups/${groupId}] Requested by UID:`, requesterUid);
  if (!groupId || !requesterUid) {
    console.error('Missing groupId or user not authenticated', { groupId, requesterUid });
    return res.status(400).json({ error: 'Missing groupId or user not authenticated' });
  }
  try {
    const groupRef = admin.firestore().collection('groups').doc(groupId);
    const groupSnap = await groupRef.get();
    console.log(`[DELETE /groups/${groupId}] Fetched group document. Exists:`, groupSnap.exists);
    if (!groupSnap.exists) {
      console.error('Group not found:', groupId);
      return res.status(404).json({ error: 'Group not found' });
    }
    const groupData = groupSnap.data() as Group;
    const isAdmin = groupData.members.some(m => m.uid === requesterUid && m.role === 'admin');
    console.log(`[DELETE /groups/${groupId}] isAdmin:`, isAdmin);
    if (!isAdmin) {
      console.error('Only group admins can delete the group. UID:', requesterUid);
      return res.status(403).json({ error: 'Only group admins can delete the group' });
    }
    // Delete all trips with this groupId
    const db = admin.firestore();
    const tripsQuery = await db.collection('trips').where('groupId', '==', groupId).get();
    if (!tripsQuery.empty) {
      const batch = db.batch();
      tripsQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`[DELETE /groups/${groupId}] Deleted ${tripsQuery.docs.length} associated trip(s).`);
    } else {
      console.log(`[DELETE /groups/${groupId}] No associated trips to delete.`);
    }
    await groupRef.delete();
    console.log(`[DELETE /groups/${groupId}] Group deleted successfully.`);
    // Optionally: delete associated trips here
    return res.json({ success: true, message: 'Group and associated trips deleted' });
  } catch (error: any) {
    console.error('Error deleting group:', error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message || 'Failed to delete group' });
  }
});

export default router; 