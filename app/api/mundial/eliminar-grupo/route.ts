import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { grupoId, userId } = await req.json();

    if (!grupoId || !userId) {
      return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
    }

    // Verificar que el usuario es el creador
    const grupoRef = db.collection('grupos_mundial').doc(grupoId);
    const grupoSnap = await grupoRef.get();

    if (!grupoSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Grupo no encontrado' }, { status: 404 });
    }

    const grupoData = grupoSnap.data();
    if (grupoData?.creadorId !== userId) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
    }

    // Eliminar todas las jugadas del grupo
    const jugadasSnap = await db.collection('jugadas_mundial')
      .where('grupoId', '==', grupoId)
      .get();

    const batch = db.batch();
    jugadasSnap.docs.forEach(doc => batch.delete(doc.ref));

    // Eliminar mensajes del chat si los hay
    const mensajesSnap = await db.collection('grupos_mundial')
      .doc(grupoId)
      .collection('mensajes')
      .get();
    mensajesSnap.docs.forEach(doc => batch.delete(doc.ref));

    // Eliminar el grupo
    batch.delete(grupoRef);

    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}