import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  console.log('Firebase Admin init:', {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKeyStart: privateKey?.substring(0, 50),
    privateKeyEnd: privateKey?.substring(privateKey.length - 50),
  });
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    } as admin.ServiceAccount),
  });
}

const db = admin.firestore();
const adminAuth = admin.auth();

export { db, adminAuth };