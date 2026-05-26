import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grupoId, userId } = body;

    console.log('eliminar-grupo llamado', { grupoId, userId });

    if (!grupoId || !userId) {
      return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
    }

    const grupoRef = db.collection('grupos_mundial').doc(grupoId);
    const grupoSnap = await grupoRef.get();

    console.log('grupo existe:', grupoSnap.exists);

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

    console.log('grupo eliminado ok');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Error eliminar-grupo:', e.message, e.stack);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}