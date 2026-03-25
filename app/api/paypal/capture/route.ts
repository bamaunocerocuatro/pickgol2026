 import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, userId, tipo } = await req.json();
    // tipo: 'plus' | 'jugada1' | 'jugada3' | 'jugada5' | 'jugada10'

    const accessToken = await getAccessToken();

    const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await res.json();

    if (capture.status === 'COMPLETED') {
      // Actualizar Firestore según el tipo de compra
      const userRef = db.collection('usuarios').doc(userId);

      if (tipo === 'plus') {
        await userRef.update({ plus: true, plusActivadoEn: new Date() });
      } else {
        // Packs de jugadas — sumar jugadas al usuario
        const jugadasMap: Record<string, number> = {
          jugada1: 1,
          jugada3: 3,
          jugada5: 5,
          jugada10: 10,
        };
        const cantidad = jugadasMap[tipo] || 0;
        const snap = await userRef.get();
        const actual = snap.data()?.jugadasMundial || 0;
        await userRef.update({ jugadasMundial: actual + cantidad });
      }

      return NextResponse.json({ ok: true, status: capture.status });
    } else {
      return NextResponse.json({ error: 'Pago no completado', status: capture.status }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

