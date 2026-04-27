import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (secret !== 'pickgol2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Llamar al cron internamente
  const baseUrl = url.origin;
  const res = await fetch(`${baseUrl}/api/cron-puntos`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
  });
  const data = await res.json();
  return NextResponse.json(data);
}