import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not set in .env");
        process.exit(1);
    }
    const sa = JSON.parse(serviceAccountJson);
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

const db = getFirestore();

async function checkMetadata() {
    console.log("--- CATEGORIES ---");
    const cats = await db.collection("inventoryCategories").get();
    cats.docs.forEach(d => {
        const data = d.data();
        console.log(`ID: ${d.id.padEnd(10)} | Slug/Name: ${String(data.name).padEnd(20)} | Label: ${data.label}`);
    });

    console.log("\n--- DEPARTMENTS ---");
    const depts = await db.collection("inventoryDepartments").get();
    depts.docs.forEach(d => {
        const data = d.data();
        console.log(`ID: ${d.id.padEnd(25)} | Name: ${String(data.name).padEnd(20)} | Slug: ${data.slug}`);
    });
    
    process.exit(0);
}

checkMetadata().catch(console.error);
