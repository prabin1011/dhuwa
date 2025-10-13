import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let app: admin.app.App | null = null;

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return { app: admin.app(), db: admin.firestore(), messaging: admin.messaging() };
    }

    let serviceAccount: admin.ServiceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_ONELINE) {
        try {
            const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_ONELINE;
            serviceAccount = JSON.parse(key);
            console.log('[FCM] Initialized Admin SDK from oneline environment variable.');
        } catch (e) {
            console.error('[FCM] Failed to parse one-line service account key from env var:', e);
            throw new Error('Service account key in environment variable is malformed.');
        }
    }
    // Fallback to local file for local development
    else {
        const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            console.log('[FCM] Initialized Admin SDK from local service-account.json file.');
        } else {
            console.error('[FCM] Service account key not found.');
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_ONELINE env var not set and service-account.json not found.');
        }
    }

    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return { app, db: admin.firestore(), messaging: admin.messaging() };
}

export { initializeAdminApp };
