import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function checkDate() {
    if (!db) return;
    const docRef = doc(db, 'businessDays', 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        console.log('Current Business Date:', data.date.toDate());
        console.log('Today Midnight:', new Date().setHours(0,0,0,0));
    } else {
        console.log('No business day doc found');
    }
}

checkDate();
