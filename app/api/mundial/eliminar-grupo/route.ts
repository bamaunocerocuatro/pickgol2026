import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getDb = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
};

export async function POST(req: NextRequest) {
  try {
    const { grupoId, userId } = await req.json();
    console.log('eliminar-grupo v2', { grupoId, userId });

    if (!grupoId || !userId) {
      return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
    }

    const db = getDb();
    const grupoRef = db.collection('grupos_mundial').doc(grupoId);
    const grupoSnap = await grupoRef.get();

    if (!grupoSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Grupo no encontrado' }, { status: 404 });
    }

    const grupoData = grupoSnap.data();
    if (grupoData?.creadorId !== userId) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
    }

    const jugadasSnap = await db.collection('jugadas_mundial')
      .where('grupoId', '==', grupoId)
      .get();

    const batch = db.batch();
    jugadasSnap.docs.forEach(doc => batch.delete(doc.ref));

    const mensajesSnap = await db.collection('grupos_mundial')
      .doc(grupoId)
      .collection('mensajes')
      .get();
    mensajesSnap.docs.forEach(doc => batch.delete(doc.ref));

    batch.delete(grupoRef);
    await batch.commit();

    console.log('eliminado ok');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Error:', e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}