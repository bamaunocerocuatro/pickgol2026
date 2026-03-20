 import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paddle-signature') || '';
    const secret = process.env.PADDLE_WEBHOOK_SECRET!;

    // Verificar firma
    const [ts, h1] = signature.split(';').map(s => s.split('=')[1]);
    const { createHmac } = await import('crypto');
    const hash = createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex');
    if (hash !== h1) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event_type === 'transaction.completed') {
      const priceId = event.data?.items?.[0]?.price?.id;
      const email = event.data?.customer?.email;

      if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS && email) {
        // Buscar usuario por email
        const q = query(collection(db, 'usuarios'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'usuarios', snap.docs[0].id), {
            plus: true,
            plusActivadoEn: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
