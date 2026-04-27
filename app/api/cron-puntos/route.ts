import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

const LIGAS_IDS: Record<string, string> = {
  premier: 'PL',
  laliga: 'PD',
  seriea: 'SA',
  bundesliga: 'BL1',
  ligue1: 'FL1',
  brasileirao: 'BSA',
};

async function getPartidosFT(liga: string) {
  const code = LIGAS_IDS[liga];
  if (!code) return [];
  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${code}/matches`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY! },
    });
    const data = await res.json();
    const matches = data?.matches || [];
    return matches
      .filter((m: any) => m.status === 'FINISHED')
      .map((m: any) => ({
        local: m.homeTeam?.shortName || m.homeTeam?.name,
        visitante: m.awayTeam?.shortName || m.awayTeam?.name,
        golesLocal: m.score?.fullTime?.home ?? 0,
        golesVisitante: m.score?.fullTime?.away ?? 0,
        jornada: m.matchday,
      }));
  } catch (e) {
    return [];
  }
}

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener todos los grupos activos
    const gruposSnap = await db.collection('grupos').get();
    let totalActualizadas = 0;

    for (const grupoDoc of gruposSnap.docs) {
      const grupo = grupoDoc.data();
      const liga = grupo.liga;
      if (!liga || !LIGAS_IDS[liga]) continue;

      // Obtener jugadas del grupo que no sean comunitarias
      const jugadasSnap = await db.collection('jugadas')
        .where('grupoId', '==', grupoDoc.id)
        .get();

      if (jugadasSnap.empty) continue;

      // Obtener partidos FT de la liga
      const partidosFT = await getPartidosFT(liga);
      if (partidosFT.length === 0) continue;

      const batch = db.batch();
      let hayActualizaciones = false;

      for (const jugadaDoc of jugadasSnap.docs) {
        const jugada = jugadaDoc.data();
        if (!jugada.predicciones?.length) continue;

        // Solo calcular partidos que no fueron calculados antes
        const yaCalculados = jugada.partidosCalculados || [];

        let puntosNuevos = 0;
        const nuevosCalculados: string[] = [];

        for (const pred of jugada.predicciones) {
          const key = `${pred.local}-${pred.visitante}`;
          if (yaCalculados.includes(key)) continue;

          const real = partidosFT.find((p: any) =>
            p.local === pred.local && p.visitante === pred.visitante
          );
          if (!real) continue;

          const predLocal = Number(pred.golesLocalPredichos);
          const predVisitante = Number(pred.golesVisitantePredichos);
          const realLocal = Number(real.golesLocal);
          const realVisitante = Number(real.golesVisitante);

          if (predLocal === realLocal && predVisitante === realVisitante) {
            puntosNuevos += 5;
          } else {
            const predGanador = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
            const realGanador = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';
            if (predGanador === realGanador) puntosNuevos += 2;
          }

          nuevosCalculados.push(key);
        }

        if (nuevosCalculados.length > 0) {
          const puntosAcumulados = jugada.puntos || 0;
          batch.update(jugadaDoc.ref, {
            puntos: puntosAcumulados + puntosNuevos,
            partidosCalculados: [...yaCalculados, ...nuevosCalculados],
            calculadoEn: new Date(),
          });
          hayActualizaciones = true;
          totalActualizadas++;
        }
      }

      if (hayActualizaciones) await batch.commit();
    }

    return NextResponse.json({ ok: true, jugadasActualizadas: totalActualizadas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}