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

    // 3. Create group doc in Firestore
    const groupData: Omit<Group, 'groupId'> = {
      name,
      createdBy: creatorUid,
      members,
      ...(tripId ? { tripId } : {}),
    };
    const groupRef = await admin.firestore().collection('groups').add(groupData);
    const groupId = groupRef.id;
    await groupRef.update({ groupId });

    return res.status(201).json({ groupId });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return res.status(500).json({ error: error.message || 'Failed to create group' });
  }
});

export default router; 