import * as admin from 'firebase-admin';

// Eliminar apps existentes para forzar reinicialización
if (admin.apps.length) {
  admin.apps.forEach(app => app?.delete());
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  } as admin.ServiceAccount),
});

const db = admin.firestore();
const adminAuth = admin.auth();

export { db, adminAuth };