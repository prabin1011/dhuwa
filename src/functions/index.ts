import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let app: admin.app.App | null = null;

function initializeAdminApp() {
    if (app) {
        return { app, db: admin.firestore(), messaging: admin.messaging() };
    }

    let serviceAccount: admin.ServiceAccount;

    // 1. Try Vercel Environment Variable (for deployed environments)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            const parsedKey = JSON.parse(Buffer.from(key, 'base64').toString('utf-8'));
            serviceAccount = parsedKey;
            console.log('[FCM] Initialized Admin SDK from environment variable.');
        } catch (e) {
            console.error('[FCM] Failed to parse service account key from env var:', e);
            throw new Error('Service account key in environment variable is malformed.');
        }
    } 
    // 2. Try local file (for local development)
    else {
        const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            console.log('[FCM] Initialized Admin SDK from local service-account.json file.');
        } else {
            console.error('[FCM] Service account key not found.');
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var not set and service-account.json not found.');
        }
    }

    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return { app, db: admin.firestore(), messaging: admin.messaging() };
}

export { initializeAdminApp };
