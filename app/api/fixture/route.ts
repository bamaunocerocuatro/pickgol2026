 import { NextRequest, NextResponse } from 'next/server';

const LIGAS_IDS: Record<string, string> = {
  premier: '2',
  laliga: '3',
  seriea: '4',
  bundesliga: '5',
  ligue1: '6',
  ligapro: '128',
  brasileirao: '13',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const liga = searchParams.get('liga') || 'premier';
  const ligaId = LIGAS_IDS[liga] || '2';

  try {
    const res = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-all-leagues`,
      {
        headers: {
          'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
          'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        },
      }
    );

    const data = await res.json();

    // Buscar fixture de la liga
    const res2 = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-matches-by-league?leagueid=${ligaId}`,
      {
        headers: {
          'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
          'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        },
      }
    );

    const data2 = await res2.json();
    const matches = data2?.response || [];

    const partidos = matches.map((m: any) => ({
      local: m.home?.name || 'Local',
      visitante: m.away?.name || 'Visitante',
      fecha: m.date || '',
      estado: m.status?.short || 'NS',
      golesLocal: m.score?.home ?? null,
      golesVisitante: m.score?.away ?? null,
    }));

    return NextResponse.json({ partidos });
  } catch (e) {
    return NextResponse.json({ partidos: [] });
  }
}
