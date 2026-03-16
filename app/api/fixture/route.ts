import { NextRequest, NextResponse } from 'next/server';

const LIGAS_IDS: Record<string, { fotmob?: string; sportsdb?: string }> = {
  premier:      { fotmob: '47',  sportsdb: '4328' },
  laliga:       { fotmob: '87',  sportsdb: '4335' },
  seriea:       { fotmob: '55',  sportsdb: '4332' },
  bundesliga:   { fotmob: '54',  sportsdb: '4331' },
  ligue1:       { fotmob: '53',  sportsdb: '4334' },
  ligapro:      { sportsdb: '4406' },
  'primera-b':  { sportsdb: '4616' },
  brasileirao:  { fotmob: '268', sportsdb: '4351' },
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

async function getFromSportsDB(ligaId: string) {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${ligaId}`,
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  const events = data?.events || [];
  return events.map((e: any) => ({
    local: e.strHomeTeam || 'Local',
    visitante: e.strAwayTeam || 'Visitante',
    fecha: e.strTimestamp || e.dateEvent || '',
    estado: 'NS',
    golesLocal: e.intHomeScore ? parseInt(e.intHomeScore) : null,
    golesVisitante: e.intAwayScore ? parseInt(e.intAwayScore) : null,
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const liga = searchParams.get('liga') || 'premier';
  const ids = LIGAS_IDS[liga] || LIGAS_IDS['premier'];

  try {
    let partidos: any[] = [];

    if (ids.fotmob) {
      partidos = await getFromFotmob(ids.fotmob);
    }

    if (partidos.length === 0 && ids.sportsdb) {
      partidos = await getFromSportsDB(ids.sportsdb);
    }

    return NextResponse.json({ partidos });
  } catch (e) {
    return NextResponse.json({ partidos: [] });
  }
}