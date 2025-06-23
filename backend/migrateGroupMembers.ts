import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, './smartvoyage-c4912-firebase-adminsdk-fbsvc-a81061ab95.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateGroupMembers() {
  console.log('Starting group members migration...');

  try {
    const groupsSnapshot = await db.collection('groups').get();
    let updateCount = 0;
    let skipCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of groupsSnapshot.docs) {
      const data = doc.data();
      // Only migrate if members is an array
      if (Array.isArray(data.members)) {
        const membersArray = data.members;
        const membersMap: Record<string, string> = {};
        for (const member of membersArray) {
          if (member.uid && member.role) {
            membersMap[member.uid] = member.role;
          }
        }
        batch.update(doc.ref, { members: membersMap });
        updateCount++;
        batchCount++;
      } else {
        skipCount++;
      }
      // Commit every 400 updates (Firestore batch limit is 500)
      if (batchCount >= 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`Migration complete. Updated: ${updateCount}, Skipped: ${skipCount}`);
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateGroupMembers()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 