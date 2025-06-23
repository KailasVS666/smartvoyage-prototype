import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, './smartvoyage-c4912-firebase-adminsdk-fbsvc-a81061ab95.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateTrips() {
  console.log('Starting trip structure migration...');
  
  try {
    const tripsSnapshot = await db.collection('trips').get();
    let currentBatch = db.batch();
    let updateCount = 0;
    
    for (const doc of tripsSnapshot.docs) {
      const data = doc.data();
      
      // Skip if already migrated
      if (data.destination) {
        continue;
      }
      
      // Parse the tripData string into an object
      let tripData;
      try {
        tripData = JSON.parse(data.tripData);
      } catch (e) {
        console.error(`Failed to parse tripData for document ${doc.id}:`, e);
        continue;
      }
      
      // Create the new document structure
      const newData: any = {
        userId: data.userId,
        memberIds: [data.userId],
        tripId: data.tripId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        destination: tripData.destination,
        duration: tripData.duration,
        budget: tripData.budget,
        travelers: tripData.travelers,
        preferences: tripData.preferences,
        itinerary: tripData.itinerary,
      };
      if (tripData.groupId !== undefined) {
        newData.groupId = tripData.groupId;
      }
      
      // Set the new data
      currentBatch.set(doc.ref, newData);
      updateCount++;
      
      // Commit batch every 500 documents
      if (updateCount % 500 === 0) {
        await currentBatch.commit();
        currentBatch = db.batch();
      }
    }
    
    // Commit any remaining updates
    if (updateCount % 500 !== 0) {
      await currentBatch.commit();
    }
    
    console.log(`Successfully migrated ${updateCount} trips`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateTrips()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 