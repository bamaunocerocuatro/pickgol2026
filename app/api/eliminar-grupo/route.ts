 import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { grupoId, userId } = await req.json();

    // Verificar que el usuario es el creador
    const grupoRef = db.collection('grupos').doc(grupoId);
    const grupoSnap = await grupoRef.get();

    if (!grupoSnap.exists()) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    if (grupoSnap.data()?.creadorId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Borrar todas las jugadas del grupo
    const jugadasSnap = await db.collection('jugadas')
      .where('grupoId', '==', grupoId)
      .get();

    const batch = db.batch();
    jugadasSnap.docs.forEach(d => batch.delete(d.ref));

    // Borrar el grupo
    batch.delete(grupoRef);

    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
