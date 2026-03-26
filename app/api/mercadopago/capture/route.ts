 import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { tipo, userId } = await req.json();

    if (!userId || !tipo) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const userRef = db.collection('usuarios').doc(userId);

    if (tipo === 'plus') {
      await userRef.update({ plus: true, plusActivadoEn: new Date() });
    } else {
      const jugadasMap: Record<string, number> = {
        jugada1: 1, jugada3: 3, jugada5: 5, jugada10: 10,
      };
      const cantidad = jugadasMap[tipo] || 0;
      const snap = await userRef.get();
      const actual = snap.data()?.jugadasMundial || 0;
      await userRef.update({ jugadasMundial: actual + cantidad });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
