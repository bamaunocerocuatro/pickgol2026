 import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { codigo, userId } = await req.json();

    if (!codigo || !userId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const codigoRef = db.collection('codigos_plus').doc(codigo.trim().toUpperCase());
    const codigoSnap = await codigoRef.get();

    if (!codigoSnap.exists()) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    const codigoData = codigoSnap.data()!;

    if (!codigoData.activo) {
      return NextResponse.json({ error: 'Código desactivado' }, { status: 400 });
    }

    if (codigoData.maxUsos > 0 && codigoData.usos >= codigoData.maxUsos) {
      return NextResponse.json({ error: 'Código agotado' }, { status: 400 });
    }

    await db.collection('usuarios').doc(userId).set({
      plus: true,
      plusActivadoEn: new Date(),
      plusCodigo: codigo.trim().toUpperCase(),
    }, { merge: true });

    await codigoRef.update({ usos: codigoData.usos + 1 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
