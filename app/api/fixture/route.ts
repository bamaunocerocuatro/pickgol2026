import { NextRequest, NextResponse } from 'next/server';

const LIGAS_IDS: Record<string, string> = {
  premier: '47',
  laliga: '87',
  seriea: '55',
  bundesliga: '54',
  ligue1: '53',
  ligapro: '329',
  brasileirao: '325',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const liga = searchParams.get('liga') || 'premier';
  const ligaId = LIGAS_IDS[liga] || '47';

  try {
    const res = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-all-matches-by-league?leagueid=${ligaId}`,
      {
        headers: {
          'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
          'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        },
        next: { revalidate: 300 }
      }
    );

    const data = await res.json();
    const matches = data?.response?.matches || [];

    const partidos = matches.map((m: any) => ({
      local: m.home?.name || 'Local',
      visitante: m.away?.name || 'Visitante',
      fecha: m.status?.utcTime || '',
      estado: m.notStarted ? 'NS' : m.status?.finished ? 'FT' : m.status?.ongoing ? 'LIVE' : 'NS',
      golesLocal: m.home?.score ?? null,
      golesVisitante: m.away?.score ?? null,
    }));

    return NextResponse.json({ partidos });
  } catch (e) {
    return NextResponse.json({ partidos: [] });
  }
}