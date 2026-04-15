import { NextRequest, NextResponse } from 'next/server';

const LIGAS_IDS: Record<string, { footballdata?: string; proximamente?: boolean }> = {
  premier:      { footballdata: 'PL' },
  laliga:       { footballdata: 'PD' },
  seriea:       { footballdata: 'SA' },
  bundesliga:   { footballdata: 'BL1' },
  ligue1:       { footballdata: 'FL1' },
  brasileirao:  { footballdata: 'BSA' },
  ligapro:      { proximamente: true },
  'primera-b':  { proximamente: true },
};

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
    jornada: m.matchday ?? null,
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
    const partidos = await getFromFootballData(ids.footballdata!);
    return NextResponse.json({ partidos });
  } catch (e) {
    return NextResponse.json({ partidos: [] });
  }
}