import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { grupoId, resultadosFecha, esComunitario = false } = await req.json();

    const coleccion = esComunitario ? 'jugadas_comunitarias_mundial' : 'jugadas_mundial';

    let jugadasSnap;
    if (grupoId) {
      jugadasSnap = await db.collection(coleccion)
        .where('grupoId', '==', grupoId)
        .where('tipo', '==', 'mundial2026')
        .get();
    } else {
      jugadasSnap = await db.collection(coleccion)
        .where('tipo', '==', 'mundial2026')
        .get();
    }

    if (jugadasSnap.empty) {
      return NextResponse.json({ ok: true, jugadasActualizadas: 0 });
    }

    const jugadas = jugadasSnap.docs.map(d => ({ ref: d.ref, ...d.data() })) as any[];

    // ── PUNTOS POR PARTIDOS ──────────────────────────────────────
    const puntosPartidos: Record<string, number> = {};
    for (const jugada of jugadas) {
      let pts = 0;
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
            pts += 5;
          } else {
            const predGanador = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
            const realGanador = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';
            if (predGanador === realGanador) pts += 2;
          }
        }
      }
      puntosPartidos[jugada.ref.id] = pts;
    }

    // ── PUNTOS POR VARIABLES ─────────────────────────────────────
    const puntosVariables: Record<string, number> = {};
    for (const jugada of jugadas) puntosVariables[jugada.ref.id] = 0;

    if (resultadosFecha.variables && jugadas[0]?.variablesMeta) {
      for (const meta of jugadas[0].variablesMeta) {
        const real = resultadosFecha.variables[meta.key];
        if (real === undefined || real === null) continue;

        if (meta.tipo === 'numero') {
          // Buscar quién acertó exacto
          const exactos = jugadas.filter(j => Number(j.variables?.[meta.key]) === Number(real));

          if (exactos.length > 0) {
            // Todos los exactos suman puntos completos
            for (const j of exactos) puntosVariables[j.ref.id] += meta.pts;
          } else {
            // Buscar el/los más cercanos
            let menorDiff = Infinity;
            for (const j of jugadas) {
              const predicho = j.variables?.[meta.key];
              if (predicho === undefined || predicho === null) continue;
              const diff = Math.abs(Number(predicho) - Number(real));
              if (diff < menorDiff) menorDiff = diff;
            }
            const masCercanos = jugadas.filter(j => {
              const predicho = j.variables?.[meta.key];
              if (predicho === undefined || predicho === null) return false;
              return Math.abs(Number(predicho) - Number(real)) === menorDiff;
            });
            const ptsMitad = Math.floor(meta.pts / 2);
            for (const j of masCercanos) puntosVariables[j.ref.id] += ptsMitad;
          }
        } else {
          // sino o texto o pais — exacto o nada
          for (const j of jugadas) {
            const predicho = j.variables?.[meta.key];
            if (predicho === undefined || predicho === null) continue;
            if (String(predicho).toLowerCase() === String(real).toLowerCase()) {
              puntosVariables[j.ref.id] += meta.pts;
            }
          }
        }
      }
    }

    // ── ACTUALIZAR FIRESTORE ─────────────────────────────────────
    const batch = db.batch();
    for (const jugada of jugadas) {
      const id = jugada.ref.id;

      // Si tiene control de pagos y no está paga → inhabilitada
      if (resultadosFecha.controlPagos && !jugada.pagadoInterno) {
        batch.update(jugada.ref, {
          puntosUltimaFecha: 0,
          calculadoEn: new Date(),
          inhabilitada: true,
        });
        continue;
      }

      const puntosEstaFecha = (puntosPartidos[id] || 0) + (puntosVariables[id] || 0);
      const puntosAcumulados = jugada.puntos || 0;
      const puntosTotal = puntosAcumulados + puntosEstaFecha;

      batch.update(jugada.ref, {
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