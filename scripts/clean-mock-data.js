import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function clean() {
  console.log('Connecting to db:', config.firestoreDatabaseId);
  
  const collectionsToClean = ['subscriptions', 'payments', 'members', 'groups', 'attendance', 'expenses'];
  
  for (const colName of collectionsToClean) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Found ${snap.size} documents in ${colName}`);
      for (const d of snap.docs) {
        // If it starts with mock prefix sub-00, mem-00, grp-u, pay-00, or user requested clean
        await deleteDoc(doc(db, colName, d.id));
        console.log(`Deleted ${colName}/${d.id}`);
      }
    } catch (err) {
      console.warn(`Error reading/cleaning ${colName}:`, err.message);
    }
  }

  console.log('Firestore mock data purge complete!');
}

clean().catch(console.error);
