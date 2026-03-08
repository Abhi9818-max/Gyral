const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Extract env from .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let val = match[2];
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
        }
        env[match[1]] = val;
    }
});

const projectId = env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
const privateKey = env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in .env.local. Please add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
});

// We need a device token to test. 
// For now we'll just query Supabase directly, but since we don't have the supabase anon key loaded easily in this simple node script, 
// let's just ask the user to provide the token, or tell them how to test.
console.log("Firebase Admin SDK successfully initialized locally!");
console.log("To fully test, a device token must be registered in the fcm_tokens table.");
