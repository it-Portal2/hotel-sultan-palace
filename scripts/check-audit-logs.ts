import { db } from '../src/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

async function checkLogs() {
    if (!db) return;
    const logsRef = collection(db, 'nightAuditLogs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    
    console.log('Recent Audit Logs:');
    snap.docs.forEach(d => {
        const data = d.data();
        console.log(`- Date: ${data.date?.toDate?.() || data.date}, Status: ${data.status}, AuditedBy: ${data.auditedBy}`);
    });
}

checkLogs();
