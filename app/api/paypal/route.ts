import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  console.log('PayPal clientId:', clientId ? 'OK' : 'MISSING');
  console.log('PayPal secret:', secret ? 'OK' : 'MISSING');

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
  console.log('PayPal token response:', JSON.stringify(data));
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, description, returnUrl, cancelUrl } = await req.json();

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ error: 'No se pudo obtener token de PayPal' }, { status: 500 });
    }

    const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency || 'USD',
            value: amount,
          },
          description,
        }],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'PickGol 2026',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const order = await res.json();
    console.log('PayPal order response:', JSON.stringify(order));

    if (order.id) {
      const approvalUrl = order.links.find((l: any) => l.rel === 'approve')?.href;
      return NextResponse.json({ orderId: order.id, approvalUrl });
    } else {
      return NextResponse.json({ error: 'Error creando orden', details: order }, { status: 500 });
    }
  } catch (e: any) {
    console.error('PayPal error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
