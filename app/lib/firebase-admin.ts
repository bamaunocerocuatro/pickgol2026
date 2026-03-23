 import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('./serviceAccount.json')
    ),
  });
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
