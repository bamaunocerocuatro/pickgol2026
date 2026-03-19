import { NextRequest, NextResponse } from 'next/server';

const LIGAS_IDS: Record<string, { fotmob?: string; footballdata?: string; proximamente?: boolean }> = {
  premier:      { fotmob: '47' },
  laliga:       { fotmob: '87' },
  seriea:       { fotmob: '55' },
  bundesliga:   { fotmob: '54' },
  ligue1:       { fotmob: '53' },
  ligapro:      { proximamente: true },
  'primera-b':  { proximamente: true },
  brasileirao:  { footballdata: 'BSA' },
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

async function getFromFootballData(competitionCode: string) {
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${competitionCode}/matches`,
    {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_KEY!,
      },
      next: { revalidate: 3600 }
    }
  );
  const data = await res.json();
  const matches = data?.matches || [];
  return matches.map((m: any) => ({
    local: m.homeTeam?.shortName || m.homeTeam?.name || 'Local',
    visitante: m.awayTeam?.shortName || m.awayTeam?.name || 'Visitante',
    fecha: m.utcDate || '',
    estado: m.status === 'FINISHED' ? 'FT' : m.status === 'TIMED' || m.status === 'SCHEDULED' ? 'NS' : m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'LIVE' : 'NS',
    golesLocal: m.score?.fullTime?.home ?? null,
    golesVisitante: m.score?.fullTime?.away ?? null,
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
    } else if (ids.footballdata) {
      partidos = await getFromFootballData(ids.footballdata);
    }

    return NextResponse.json({ partidos });
  } catch (e) {
    return NextResponse.json({ partidos: [] });
  }
}
