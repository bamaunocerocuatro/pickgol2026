 import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, description, returnUrl, tipo, userId } = await req.json();

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 });
    }

    const preference = {
      items: [{
        title: description,
        quantity: 1,
        unit_price: amount,
        currency_id: 'USD',
      }],
      back_urls: {
        success: `${returnUrl}?mp_status=success&tipo=${tipo}&userId=${userId}`,
        failure: `${returnUrl}?mp_status=failure`,
        pending: `${returnUrl}?mp_status=pending`,
      },
      auto_return: 'approved',
      metadata: { tipo, userId },
    };

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();
    console.log('MP preference response:', JSON.stringify(data));

    if (data.init_point) {
      return NextResponse.json({ initPoint: data.init_point, id: data.id });
    } else {
      return NextResponse.json({ error: 'Error creando preferencia', details: data }, { status: 500 });
    }
  } catch (e: any) {
    console.error('MP error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

