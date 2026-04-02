import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');

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

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ error: 'No se pudo autenticar con PayPal' }, { status: 500 });
    }

    const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await res.json();
    console.log('PayPal capture status:', capture.status, capture.details?.[0]?.issue);

    if (capture.status === 'COMPLETED') {
      const userRef = db.collection('usuarios').doc(userId);

      if (tipo === 'plus') {
        await userRef.set({ plus: true, plusActivadoEn: new Date() }, { merge: true });
      } else {
        const jugadasMap: Record<string, number> = {
          jugada1: 1, jugada3: 3, jugada5: 5, jugada10: 10,
        };
        const cantidad = jugadasMap[tipo] || 0;
        const snap = await userRef.get();
        const actual = snap.data()?.jugadasMundial || 0;
        await userRef.set({ jugadasMundial: actual + cantidad }, { merge: true });
      }

      return NextResponse.json({ ok: true, status: capture.status });
    } else {
      return NextResponse.json({ error: 'Pago no completado', status: capture.status, details: capture.details }, { status: 400 });
    }
  } catch (e: any) {
    console.error('PayPal capture error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
