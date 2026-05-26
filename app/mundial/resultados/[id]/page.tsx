'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const VARIABLES_MUNDIAL_DEFAULT = [
  { key: 'campeon', label: '¿Quién fue el campeón del mundo?', tipo: 'texto' },
  { key: 'subcampeon', label: '¿Quién fue el subcampeón del mundo?', tipo: 'texto' },
  { key: 'goleador', label: '¿Quién fue el goleador del mundial? (solo apellido, no cuenta definición por penales)', tipo: 'texto' },
  { key: 'vallaInvicta', label: '¿Qué país tuvo la valla menos vencida?', tipo: 'texto' },
  { key: 'masGoleador', label: '¿Cuál fue el país más goleador?', tipo: 'texto' },
  { key: 'golesMax', label: '¿Cuántos goles tuvo el partido con más goles? (no cuenta definición por penales)', tipo: 'numero' },
  { key: 'penales', label: '¿Cuántos penales hubo en toda la competencia? (no cuenta definición por penales)', tipo: 'numero' },
  { key: 'golAntes3', label: '¿Hubo un gol antes del min 3 en algún partido de la competencia?', tipo: 'sino' },
  { key: 'tarjetasRojas', label: '¿Cuántas tarjetas rojas hubo en toda la competencia?', tipo: 'numero' },
  { key: 'golesVar', label: '¿Cuántos goles anuló el VAR?', tipo: 'numero' },
];

export default function CargarResultadosMundial() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [variables, setVariables] = useState<any[]>(VARIABLES_MUNDIAL_DEFAULT);
  const [valoresVariables, setValoresVariables] = useState<Record<string, string>>({});
  const [resultadosPartidos, setResultadosPartidos] = useState<Record<string, { local: string; visitante: string }>>({});
  const [modoCorreccion, setModoCorreccion] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [soloVariables, setSoloVariables] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'grupos_mundial', id));
        if (!snap.exists()) { router.push('/mundial/grupos'); return; }
        const grupoData = { id: snap.id, ...snap.data() } as any;
        if (grupoData.creadorId !== u.uid) { router.push(`/mundial/grupo/${id}`); return; }
        setGrupo(grupoData);
        if (grupoData.variablesCustom?.length > 0) {
          setVariables(grupoData.variablesCustom.map((v: any) => ({
            key: v.key,
            label: v.label.replace('habrá', 'hubo').replace('Habrá', 'Hubo').replace('será', 'fue').replace('Será', 'Fue').replace('tendrá', 'tuvo').replace('Tendrá', 'Tuvo').replace('anulará', 'anuló').replace('Anulará', 'Anuló'),
            tipo: v.tipo,
          })));
        }
        cargarPartidos();
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const cargarPartidos = async () => {
    setCargandoPartidos(true);
    try {
      const res = await fetch('/api/mundial/fixture');
      const data = await res.json();
      const terminados = (data.partidos || []).filter((p: any) => p.estado === 'FT');
      setPartidos(terminados);
      const init: Record<string, { local: string; visitante: string }> = {};
      terminados.forEach((p: any, i: number) => {
        init[i] = {
          local: String(p.golesLocal ?? ''),
          visitante: String(p.golesVisitante ?? ''),
        };
      });
      setResultadosPartidos(init);
    } catch (e) { setPartidos([]); }
    setCargandoPartidos(false);
  };

  const setValor = (key: string, valor: string) =>
    setValoresVariables(prev => ({ ...prev, [key]: valor }));

  const setResultado = (i: number, tipo: 'local' | 'visitante', valor: string) =>
    setResultadosPartidos(prev => ({ ...prev, [i]: { ...prev[i], [tipo]: valor } }));

  const calcularPuntos = async () => {
    setError('');

    if (soloVariables) {
      for (const v of variables) {
        if (!valoresVariables[v.key] && valoresVariables[v.key] !== '0') {
          setError('Completá todas las variables antes de calcular'); return;
        }
      }
    }

    if (!soloVariables && partidos.length > 0) {
      for (let i = 0; i < partidos.length; i++) {
        const r = resultadosPartidos[i];
        if (!r || r.local === '' || r.visitante === '') {
          setError('Falta el resultado de algún partido'); return;
        }
      }
    }

    setCalculando(true);
    try {
      const variablesFinales: Record<string, any> = {};
      if (soloVariables) {
        variables.forEach(v => {
          variablesFinales[v.key] = v.tipo === 'numero' ? parseInt(valoresVariables[v.key] || '0') : valoresVariables[v.key];
        });
      }

      const partidosFinales = !soloVariables ? partidos.map((p: any, i: number) => ({
        local: p.local,
        visitante: p.visitante,
        golesLocal: parseInt(resultadosPartidos[i]?.local || '0'),
        golesVisitante: parseInt(resultadosPartidos[i]?.visitante || '0'),
      })) : [];

      const res = await fetch('/api/mundial/calcular-puntos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: id,
          esComunitario: false,
          resultadosFecha: {
            variables: Object.keys(variablesFinales).length > 0 ? variablesFinales : undefined,
            partidos: partidosFinales,
            controlPagos: grupo?.controlPagos || false,
          }
        })
      });

      const data = await res.json();
      if (data.ok) {
        setMensaje(`✅ Puntos calculados para ${data.jugadasActualizadas} jugada${data.jugadasActualizadas !== 1 ? 's' : ''}`);
        setTimeout(() => router.push(`/mundial/grupo/${id}`), 2000);
      } else {
        setError('Error al calcular: ' + data.error);
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    }
    setCalculando(false);
  };

  const YN = ({ varKey }: { varKey: string }) => (
    <div className="flex gap-2">
      <div onClick={() => setValor(varKey, 'si')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: valoresVariables[varKey] === 'si' ? 'rgba(200,170,110,0.15)' : 'rgba(200,170,110,0.04)', border: valoresVariables[varKey] === 'si' ? '1px solid #C8AA6E' : '1px solid rgba(200,170,110,0.15)', color: valoresVariables[varKey] === 'si' ? '#C8AA6E' : 'rgba(210,185,130,0.55)' }}>
        ✅ SÍ
      </div>
      <div onClick={() => setValor(varKey, 'no')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: valoresVariables[varKey] === 'no' ? 'rgba(232,25,44,0.12)' : 'rgba(200,170,110,0.04)', border: valoresVariables[varKey] === 'no' ? '1px solid #E8192C' : '1px solid rgba(200,170,110,0.15)', color: valoresVariables[varKey] === 'no' ? '#E8192C' : 'rgba(210,185,130,0.55)' }}>
        ❌ NO
      </div>
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">🏆</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push(`/mundial/grupo/${id}`)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>
            <b style={{ color: 'rgba(210,185,130,0.85)' }}>{grupo?.nombre}</b>
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1" style={{ color: '#C8AA6E' }}>📊 Cargar Resultados</h1>
        <p className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Solo el creador puede cargar resultados</p>
      </div>

      <div className="px-4 py-4">

        {/* MODO */}
        <div className="flex gap-2 mb-4">
          <div onClick={() => setSoloVariables(false)}
            className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-xs font-bold"
            style={{ background: !soloVariables ? 'rgba(200,170,110,0.12)' : 'rgba(200,170,110,0.04)', border: !soloVariables ? '1px solid #C8AA6E' : '1px solid rgba(200,170,110,0.15)', color: !soloVariables ? '#C8AA6E' : 'rgba(210,185,130,0.5)' }}>
            ⚽ Partidos
          </div>
          <div onClick={() => setSoloVariables(true)}
            className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-xs font-bold"
            style={{ background: soloVariables ? 'rgba(200,170,110,0.12)' : 'rgba(200,170,110,0.04)', border: soloVariables ? '1px solid #C8AA6E' : '1px solid rgba(200,170,110,0.15)', color: soloVariables ? '#C8AA6E' : 'rgba(210,185,130,0.5)' }}>
            🏆 Variables Finales
          </div>
        </div>

        {/* VARIABLES FINALES */}
        {soloVariables && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(210,185,130,0.6)' }}>
              Variables finales del Mundial
            </div>
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(200,170,110,0.06)', border: '1px solid rgba(200,170,110,0.15)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)' }}>Cargá estas variables solo cuando el torneo haya terminado. Los puntos se suman a los acumulados de los partidos.</p>
            </div>
            {variables.map((v) => (
              <div key={v.key} className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'rgba(210,185,130,0.65)' }}>{v.label}</label>
                {v.tipo === 'numero' ? (
                  <input type="number" value={valoresVariables[v.key] || ''} onChange={(e) => setValor(v.key, e.target.value)}
                    placeholder="0" className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'rgba(200,170,110,0.05)', border: valoresVariables[v.key] ? '1px solid rgba(200,170,110,0.4)' : '1px solid rgba(200,170,110,0.15)', color: '#F5F5F0' }} />
                ) : v.tipo === 'sino' ? (
                  <YN varKey={v.key} />
                ) : (
                  <input type="text" value={valoresVariables[v.key] || ''} onChange={(e) => setValor(v.key, e.target.value)}
                    placeholder="Escribí el valor real..." className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: 'rgba(200,170,110,0.05)', border: valoresVariables[v.key] ? '1px solid rgba(200,170,110,0.4)' : '1px solid rgba(200,170,110,0.15)', color: '#F5F5F0' }} />
                )}
              </div>
            ))}
          </>
        )}

        {/* PARTIDOS */}
        {!soloVariables && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(210,185,130,0.6)' }}>
              Resultados de partidos
            </div>

            {cargandoPartidos && (
              <div className="text-center py-4"><div className="text-2xl mb-2">⏳</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando partidos...</p></div>
            )}

            {!cargandoPartidos && partidos.length === 0 && (
              <div className="rounded-2xl p-5 text-center mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="text-3xl mb-2">📅</div>
                <div className="font-condensed text-base font-bold mb-1" style={{ color: '#F5F5F0' }}>Sin partidos terminados</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>No hay partidos finalizados todavía</div>
              </div>
            )}

            {!cargandoPartidos && partidos.length > 0 && (
              <>
                <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                  {partidos.map((p: any, i: number) => (
                    <div key={i} className="flex items-center px-4 py-2"
                      style={{ borderBottom: i < partidos.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none' }}>
                      <span className="flex-1 text-sm font-semibold truncate" style={{ color: '#F5F5F0' }}>{p.local}</span>
                      <span className="font-condensed text-base font-black px-3" style={{ color: '#C8AA6E' }}>
                        {modoCorreccion ? (
                          <span className="flex items-center gap-1">
                            <input type="number" min="0" value={resultadosPartidos[i]?.local || ''}
                              onChange={(e) => setResultado(i, 'local', e.target.value)}
                              className="w-8 rounded-lg px-1 py-0.5 text-sm font-black text-center outline-none"
                              style={{ background: 'rgba(232,25,44,0.15)', border: '1px solid rgba(232,25,44,0.3)', color: 'white' }} />
                            <span style={{ color: 'rgba(210,185,130,0.4)' }}>-</span>
                            <input type="number" min="0" value={resultadosPartidos[i]?.visitante || ''}
                              onChange={(e) => setResultado(i, 'visitante', e.target.value)}
                              className="w-8 rounded-lg px-1 py-0.5 text-sm font-black text-center outline-none"
                              style={{ background: 'rgba(232,25,44,0.15)', border: '1px solid rgba(232,25,44,0.3)', color: 'white' }} />
                          </span>
                        ) : (
                          `${resultadosPartidos[i]?.local ?? '?'} - ${resultadosPartidos[i]?.visitante ?? '?'}`
                        )}
                      </span>
                      <span className="flex-1 text-sm font-semibold truncate text-right" style={{ color: '#F5F5F0' }}>{p.visitante}</span>
                    </div>
                  ))}
                </div>

                {!modoCorreccion ? (
                  <div className="mb-4">
                    <button onClick={() => setModoCorreccion(true)}
                      className="w-full py-2 rounded-xl font-condensed font-bold text-sm"
                      style={{ background: 'transparent', border: '1px solid rgba(255,179,0,0.3)', color: '#FFB300' }}>
                      ⚠️ Corregir resultados manualmente
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(255,179,0,0.07)', border: '1px solid rgba(255,179,0,0.3)' }}>
                    <span>⚠️</span>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Estás editando manualmente. Verificá bien antes de calcular.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {grupo?.controlPagos && (
          <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(255,179,0,0.07)', border: '1px solid rgba(255,179,0,0.3)' }}>
            <span>💰</span>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Este grupo tiene control de pagos. Las jugadas con <b style={{ color: 'white' }}>pago pendiente</b> quedarán con 0 puntos.</p>
          </div>
        )}

        {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
        {mensaje && <p className="text-xs mb-4" style={{ color: '#00C853' }}>{mensaje}</p>}

        <button onClick={calcularPuntos} disabled={calculando}
          className="w-full py-4 rounded-xl font-condensed font-black text-xl mb-3"
          style={{ background: calculando ? 'rgba(200,170,110,0.1)' : '#C8AA6E', color: calculando ? 'rgba(210,185,130,0.5)' : '#0d0d1a', opacity: calculando ? 0.7 : 1 }}>
          {calculando ? '⏳ CALCULANDO...' : '🏆 CALCULAR PUNTOS'}
        </button>

        <button onClick={() => router.push(`/mundial/grupo/${id}`)}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
          CANCELAR
        </button>

      </div>
    </main>
  );
}