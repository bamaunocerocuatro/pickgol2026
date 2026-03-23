 import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { grupoId, resultadosFecha } = await req.json();

    // Obtener todas las jugadas del grupo
    const jugadasSnap = await db.collection('jugadas')
      .where('grupoId', '==', grupoId)
      .get();

    if (jugadasSnap.empty) {
      return NextResponse.json({ ok: true, jugadasActualizadas: 0 });
    }

    const batch = db.batch();

    for (const jugadaDoc of jugadasSnap.docs) {
      const jugada = jugadaDoc.data();
      let puntos = 0;

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
            puntos += 5; // resultado exacto
          } else {
            const predGanador = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
            const realGanador = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';
            if (predGanador === realGanador) puntos += 2; // ganador correcto
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
            if (Number(predicho) === Number(real)) puntos += meta.pts;
          } else {
            if (String(predicho) === String(real)) puntos += meta.pts;
          }
        }
      }

      batch.update(jugadaDoc.ref, {
        puntos,
        calculadoEn: new Date(),
      });
    }

    await batch.commit();
    return NextResponse.json({ ok: true, jugadasActualizadas: jugadasSnap.size });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
