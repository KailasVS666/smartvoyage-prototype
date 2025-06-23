import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, './smartvoyage-c4912-firebase-adminsdk-fbsvc-a81061ab95.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateGroups() {
  console.log('Starting group migration...');
  
  try {
    const groupsSnapshot = await db.collection('groups').get();
    const batch = db.batch();
    let updateCount = 0;
    
    for (const doc of groupsSnapshot.docs) {
      const data = doc.data();
      
      // Skip if already migrated
      if (!data.memberUids) {
        continue;
      }
      
      // If we have members array but still have memberUids, just remove memberUids
      if (data.members && Array.isArray(data.members)) {
        const { memberUids, ...restData } = data;
        batch.set(doc.ref, restData, { merge: true });
        updateCount++;
        continue;
      }
      
      // If we don't have proper members array, create it from memberUids
      const members = (data.memberUids || []).map((uid: string) => ({
        uid,
        role: uid === data.createdBy ? 'admin' : 'editor'
      }));
      
      const { memberUids, ...restData } = data;
      batch.set(doc.ref, {
        ...restData,
        members
      }, { merge: true });
      updateCount++;
    }
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${updateCount} groups`);
    } else {
      console.log('No groups needed migration');
    }
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateGroups()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 