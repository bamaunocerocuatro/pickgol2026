import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { grupoId, resultadosFecha } = await req.json();

    const jugadasSnap = await db.collection('jugadas')
      .where('grupoId', '==', grupoId)
      .get();

    if (jugadasSnap.empty) {
      return NextResponse.json({ ok: true, jugadasActualizadas: 0 });
    }

    const batch = db.batch();

    for (const jugadaDoc of jugadasSnap.docs) {
      const jugada = jugadaDoc.data();

      // Si el grupo tiene control de pagos y la jugada no está paga → 0 puntos
      if (resultadosFecha.controlPagos && !jugada.pagadoInterno) {
        batch.update(jugadaDoc.ref, {
          puntosUltimaFecha: 0,
          calculadoEn: new Date(),
          inhabilitada: true
        });
        continue;
      }

      let puntosEstaFecha = 0;

      // 1. Puntos por predicciones de partidos
      if (jugada.predicciones && resultadosFecha.partidos) {
        for (const pred of jugada.predicciones) {
          const real = resultadosFecha.partidos.find((p: any) =>
            p.local === pred.local && p.visitante === pred.visitante
          );
          if (!real) continue;

          const predLocal = Number(pred.golesLocalPredichos);
          const predVisitante = Number(pred.golesVisitantePredichos);
          const realLocal = Number(real.golesLocal);
          const realVisitante = Number(real.golesVisitante);

          if (predLocal === realLocal && predVisitante === realVisitante) {
            puntosEstaFecha += 5;
          } else {
            const predGanador = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
            const realGanador = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';
            if (predGanador === realGanador) puntosEstaFecha += 2;
          }
        }
      }

      // 2. Puntos por variables globales
      if (jugada.variables && resultadosFecha.variables && jugada.variablesMeta) {
        for (const meta of jugada.variablesMeta) {
          const predicho = jugada.variables[meta.key];
          const real = resultadosFecha.variables[meta.key];
          if (predicho === undefined || real === undefined) continue;

          if (meta.tipo === 'numero') {
            if (Number(predicho) === Number(real)) puntosEstaFecha += meta.pts;
          } else {
            if (String(predicho) === String(real)) puntosEstaFecha += meta.pts;
          }
        }
      }

      // Sumar a los puntos acumulados anteriores
      const puntosAcumulados = jugada.puntos || 0;
      const puntosTotal = puntosAcumulados + puntosEstaFecha;

      batch.update(jugadaDoc.ref, {
        puntos: puntosTotal,
        puntosUltimaFecha: puntosEstaFecha,
        calculadoEn: new Date(),
        inhabilitada: false,
      });
    }

    await batch.commit();
    return NextResponse.json({ ok: true, jugadasActualizadas: jugadasSnap.size });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
