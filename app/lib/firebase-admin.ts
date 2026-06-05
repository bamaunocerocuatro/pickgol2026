import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  console.log('key type:', typeof privateKey);
  console.log('key length:', privateKey?.length);
  console.log('has real newlines:', privateKey?.includes('\n'));
  console.log('has literal backslash n:', privateKey?.includes('\\n'));
  
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