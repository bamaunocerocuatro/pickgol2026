import { NextRequest, NextResponse } from 'next/server';

const LIGAS_IDS: Record<string, { fotmob?: string; proximamente?: boolean }> = {
  premier:      { fotmob: '47' },
  laliga:       { fotmob: '87' },
  seriea:       { fotmob: '55' },
  bundesliga:   { fotmob: '54' },
  ligue1:       { fotmob: '53' },
  ligapro:      { proximamente: true },
  'primera-b':  { proximamente: true },
  brasileirao:  { fotmob: '268' },
};

async function getFromFotmob(ligaId: string) {
  const res = await fetch(
    `https://free-api-live-football-data.p.rapidapi.com/football-get-all-matches-by-league?leagueid=${ligaId}`,
    {
      headers: {
        'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      },
      next: { revalidate: 3600 }
    }
  );
  const data = await res.json();
  const matches = data?.response?.matches || [];
  return matches.map((m: any) => ({
    local: m.home?.name || 'Local',
    visitante: m.away?.name || 'Visitante',
    fecha: m.status?.utcTime || '',
    estado: m.notStarted ? 'NS' : m.status?.finished ? 'FT' : m.status?.ongoing ? 'LIVE' : 'NS',
    golesLocal: m.home?.score ?? null,
    golesVisitante: m.away?.score ?? null,
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const liga = searchParams.get('liga') || 'premier';
  const ids = LIGAS_IDS[liga] || LIGAS_IDS['premier'];

  if (ids.proximamente) {
    return NextResponse.json({ partidos: [], proximamente: true });
  }

  try {
    let partidos: any[] = [];
    if (ids.fotmob) {
      partidos = await getFromFotmob(ids.fotmob);
    }
    return NextResponse.json({ partidos });
  } catch (e) {
    return NextResponse.json({ partidos: [] });
  }
}