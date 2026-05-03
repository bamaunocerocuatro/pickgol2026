import { NextRequest, NextResponse } from 'next/server';

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY!;

async function getPartidosMundial() {
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
    {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY },
      next: { revalidate: 300 }
    }
  );
  const data = await res.json();
  const matches = data?.matches || [];

  // Solo fase de grupos
  const faseGrupos = matches.filter((m: any) => m.stage === 'GROUP_STAGE');

  return faseGrupos.map((m: any) => ({
    id: m.id,
    local: m.homeTeam?.shortName || m.homeTeam?.name || 'Por definir',
    localLogo: m.homeTeam?.crest || null,
    visitante: m.awayTeam?.shortName || m.awayTeam?.name || 'Por definir',
    visitanteLogo: m.awayTeam?.crest || null,
    fecha: m.utcDate,
    estado: m.status === 'FINISHED' ? 'FT'
      : m.status === 'IN_PLAY' || m.status === 'PAUSED' ? '1H'
      : 'NS',
    golesLocal: m.score?.fullTime?.home ?? null,
    golesVisitante: m.score?.fullTime?.away ?? null,
    grupo: m.group?.replace('GROUP_', 'Grupo ') || '',
    jornada: m.matchday,
    ronda: `Jornada ${m.matchday} · ${m.group?.replace('GROUP_', 'Grupo ')}`,
    ciudad: null,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const partidos = await getPartidosMundial();
    return NextResponse.json({ partidos });
  } catch (e: any) {
    return NextResponse.json({ partidos: [], error: e.message });
  }
}