'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const VARIABLES_DEFAULT = [
  { key: 'amarillas', label: '¿Cuántas amarillas hubo?', tipo: 'numero' },
  { key: 'rojas', label: '¿Cuántas rojas hubo?', tipo: 'numero' },
  { key: 'goles', label: '¿Cuántos goles hubo en la fecha?', tipo: 'numero' },
  { key: 'golesMax', label: '¿Cuántos goles tuvo el partido con más goles?', tipo: 'numero' },
  { key: 'penales', label: '¿Cuántos penales hubo?', tipo: 'numero' },
  { key: 'hayGolAntes5', label: '¿Hubo un gol antes del min 5?', tipo: 'sino' },
  { key: 'hayGolAlargue', label: '¿Hubo gol en el alargue del 2do tiempo?', tipo: 'sino' },
  { key: 'hayCeroCero', label: '¿Hubo algún resultado 0-0?', tipo: 'sino' },
  { key: 'varAnulaGol', label: '¿El VAR anuló algún gol?', tipo: 'sino' },
];

export default function CargarResultados() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [variables, setVariables] = useState<any[]>(VARIABLES_DEFAULT);
  const [valoresVariables, setValoresVariables] = useState<Record<string, string>>({});
  const [resultadosPartidos, setResultadosPartidos] = useState<Record<string, { local: string; visitante: string }>>({});
  const [calculando, setCalculando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'grupos', id));
        if (!snap.exists()) { router.push('/grupos'); return; }
        const grupoData = { id: snap.id, ...snap.data() } as any;
        // Solo el creador puede acceder
        if (grupoData.creadorId !== u.uid) { router.push(`/grupo/${id}`); return; }
        setGrupo(grupoData);
        // Si tiene variables custom usarlas
        if (grupoData.variablesCustom?.length > 0) {
          setVariables(grupoData.variablesCustom.map((v: any) => ({
            key: v.key, label: v.label.replace('¿Cuántas', '¿Cuántas').replace('habrá', 'hubo').replace('Habrá', 'Hubo'),
            tipo: v.tipo
          })));
        }
        // Cargar partidos de la liga
        cargarPartidos(grupoData.liga);
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const cargarPartidos = async (liga: string) => {
    setCargandoPartidos(true);
    try {
      const res = await fetch(`/api/fixture?liga=${liga}`);
      const data = await res.json();
      const todos = data.partidos || [];
      // Mostrar partidos terminados (FT) de la última fecha
      const terminados = todos.filter((p: any) => p.estado === 'FT');
      if (terminados.length === 0) { setPartidos([]); setCargandoPartidos(false); return; }

      // Agrupar por fecha y tomar la más reciente
      const fechas = terminados.map((p: any) => p.fecha.substring(0, 10));
      const fechaMax = fechas.sort().reverse()[0];
      const fechaMaxDate = new Date(fechaMax);
      const fechaMinDate = new Date(fechaMax);
      fechaMinDate.setDate(fechaMinDate.getDate() - 4);

      const ultimaFecha = terminados.filter((p: any) => {
        const d = new Date(p.fecha);
        return d >= fechaMinDate && d <= fechaMaxDate;
      });

      setPartidos(ultimaFecha);

      // Pre-cargar resultados reales de la API
      const init: Record<string, { local: string; visitante: string }> = {};
      ultimaFecha.forEach((p: any, i: number) => {
        init[i] = {
          local: String(p.golesLocal ?? ''),
          visitante: String(p.golesVisitante ?? '')
        };
      });
      setResultadosPartidos(init);
    } catch (e) {}
    setCargandoPartidos(false);
  };

  const setValor = (key: string, valor: string) => {
    setValoresVariables(prev => ({ ...prev, [key]: valor }));
  };

  const setResultado = (i: number, tipo: 'local' | 'visitante', valor: string) => {
    setResultadosPartidos(prev => ({ ...prev, [i]: { ...prev[i], [tipo]: valor } }));
  };

  const calcularPuntos = async () => {
    setError('');
    // Validar variables
    for (const v of variables) {
      if (!valoresVariables[v.key] && valoresVariables[v.key] !== '0') {
        setError('Completá todas las variables antes de calcular'); return;
      }
    }
    // Validar partidos
    for (let i = 0; i < partidos.length; i++) {
      const r = resultadosPartidos[i];
      if (!r || r.local === '' || r.visitante === '') {
        setError('Completá todos los resultados de partidos'); return;
      }
    }

    setCalculando(true);
    try {
      const variablesFinales: Record<string, any> = {};
      variables.forEach(v => {
        variablesFinales[v.key] = v.tipo === 'numero' ? parseInt(valoresVariables[v.key] || '0') : valoresVariables[v.key];
      });

      const partidosFinales = partidos.map((p: any, i: number) => ({
        local: p.local,
        visitante: p.visitante,
        golesLocal: parseInt(resultadosPartidos[i]?.local || '0'),
        golesVisitante: parseInt(resultadosPartidos[i]?.visitante || '0'),
      }));

      const res = await fetch('/api/calcular-puntos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: id,
          resultadosFecha: {
            variables: variablesFinales,
            partidos: partidosFinales,
          }
        })
      });

      const data = await res.json();
      if (data.ok) {
        setMensaje(`✅ Puntos calculados para ${data.jugadasActualizadas} jugada${data.jugadasActualizadas !== 1 ? 's' : ''}`);
        setTimeout(() => router.push(`/grupo/${id}`), 2000);
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
        style={{ background: valoresVariables[varKey] === 'si' ? 'rgba(0,200,83,0.15)' : 'rgba(0,0,0,0.35)', border: valoresVariables[varKey] === 'si' ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.09)', color: valoresVariables[varKey] === 'si' ? '#00C853' : '#8892A4' }}>
        ✅ SÍ
      </div>
      <div onClick={() => setValor(varKey, 'no')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: valoresVariables[varKey] === 'no' ? 'rgba(232,25,44,0.15)' : 'rgba(0,0,0,0.35)', border: valoresVariables[varKey] === 'no' ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.09)', color: valoresVariables[varKey] === 'no' ? '#E8192C' : '#8892A4' }}>
        ❌ NO
      </div>
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">⚽</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push(`/grupo/${id}`)}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>{grupo?.nombre}</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">📊 Cargar Resultados</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Cargá los resultados reales de la fecha para calcular los puntos</p>
      </div>

      <div className="px-4 py-4">

        {/* VARIABLES */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Variables de la fecha
        </div>

        {variables.map((v) => (
          <div key={v.key} className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>{v.label}</label>
            {v.tipo === 'numero' ? (
              <input type="number" value={valoresVariables[v.key] || ''} onChange={(e) => setValor(v.key, e.target.value)}
                placeholder="0" className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{background:'rgba(0,0,0,0.35)',border: valoresVariables[v.key] !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)'}} />
            ) : (
              <YN varKey={v.key} />
            )}
          </div>
        ))}

        {/* RESULTADOS PARTIDOS */}
        {cargandoPartidos && (
          <div className="text-center py-6"><div className="text-3xl mb-2">⏳</div><p className="text-sm" style={{color:'#8892A4'}}>Cargando partidos...</p></div>
        )}

        {!cargandoPartidos && partidos.length > 0 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3 mt-2" style={{color:'#8892A4'}}>
              Resultados de partidos
            </div>
            <div className="rounded-xl p-3 mb-3 flex gap-2" style={{background:'rgba(0,200,83,0.07)',border:'1px solid rgba(0,200,83,0.2)'}}>
              <span>ℹ️</span>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>Los resultados se cargaron automáticamente desde la API. Verificalos antes de calcular.</p>
            </div>
            {partidos.map((p: any, i: number) => (
              <div key={i} className="rounded-2xl p-4 mb-3" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-right">
                    <div className="text-sm font-bold mb-2">{p.local}</div>
                    <input type="number" min="0" value={resultadosPartidos[i]?.local || ''}
                      onChange={(e) => setResultado(i, 'local', e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                      style={{background:'rgba(0,200,83,0.1)',border:'1px solid rgba(0,200,83,0.3)'}} />
                  </div>
                  <div className="font-condensed text-xl font-black px-2" style={{color:'#8892A4'}}>—</div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold mb-2">{p.visitante}</div>
                    <input type="number" min="0" value={resultadosPartidos[i]?.visitante || ''}
                      onChange={(e) => setResultado(i, 'visitante', e.target.value)}
                      className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                      style={{background:'rgba(0,200,83,0.1)',border:'1px solid rgba(0,200,83,0.3)'}} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!cargandoPartidos && partidos.length === 0 && (
          <div className="rounded-2xl p-5 text-center mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-3xl mb-2">📅</div>
            <div className="font-condensed text-base font-bold mb-1">Sin partidos terminados</div>
            <div className="text-xs" style={{color:'#8892A4'}}>No hay partidos finalizados para cargar resultados</div>
          </div>
        )}

        {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}
        {mensaje && <p className="text-xs mb-4" style={{color:'#00C853'}}>{mensaje}</p>}

        <button onClick={calcularPuntos} disabled={calculando}
          className="w-full py-4 rounded-xl font-condensed font-black text-xl mb-3"
          style={{background: calculando ? 'rgba(255,255,255,0.1)' : '#E8192C', color: calculando ? '#8892A4' : 'white', opacity: calculando ? 0.7 : 1}}>
          {calculando ? '⏳ CALCULANDO...' : '🏆 CALCULAR PUNTOS'}
        </button>

        <button onClick={() => router.push(`/grupo/${id}`)}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}>
          CANCELAR
        </button>

      </div>
    </main>
  );
}
