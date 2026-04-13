'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

const VARIABLES_DEFAULT = [
  { key: 'amarillas', label: '¿Cuántas amarillas habrá?', pts: 12, tipo: 'numero' },
  { key: 'rojas', label: '¿Cuántas rojas habrá?', pts: 10, tipo: 'numero' },
  { key: 'goles', label: '¿Cuántos goles habrá en la fecha?', pts: 8, tipo: 'numero' },
  { key: 'golesMax', label: '¿Cuántos goles tendrá el partido con más goles?', pts: 10, tipo: 'numero' },
  { key: 'penales', label: '¿Cuántos penales habrá?', pts: 10, tipo: 'numero' },
  { key: 'hayGolAntes5', label: '¿Habrá un gol antes del min 5?', pts: 5, tipo: 'sino' },
  { key: 'hayGolAlargue', label: '¿Habrá gol en el alargue del 2do tiempo?', pts: 6, tipo: 'sino' },
  { key: 'hayCeroCero', label: '¿Habrá algún resultado 0-0?', pts: 2, tipo: 'sino' },
  { key: 'varAnulaGol', label: '¿El VAR anulará algún gol?', pts: 5, tipo: 'sino' },
];

function CrearJugadaForm() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [fechaBloqueada, setFechaBloqueada] = useState(false);
  const searchParams = useSearchParams();
  const grupoId = searchParams.get('grupo');

  const [variables, setVariables] = useState<any[]>(VARIABLES_DEFAULT);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [partidos, setPartidos] = useState<any[]>([]);
  const [predicciones, setPredicciones] = useState<Record<string, { local: string; visitante: string }>>({});
  const [cargandoPartidos, setCargandoPartidos] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      if (grupoId) {
        const snap = await getDoc(doc(db, 'grupos', grupoId));
        if (snap.exists()) {
          const grupoData = { id: snap.id, ...snap.data() } as any;
          setGrupo(grupoData);
          if (grupoData.variablesCustom && grupoData.variablesCustom.length > 0) {
            setVariables(grupoData.variablesCustom);
          }
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [grupoId]);

  useEffect(() => {
    if (loading) return;
    const liga = grupo?.liga || (!grupoId ? 'premier' : null);
    if (liga && (step === 1 || step === 3)) {
      cargarPartidos(liga);
    }
  }, [step, grupo, loading]);

  const cargarPartidos = async (liga: string) => {
    setCargandoPartidos(true);
    setFechaBloqueada(false);
    try {
      const res = await fetch(`/api/fixture?liga=${liga}`);
      const data = await res.json();
      const todos = data.partidos || [];

      const hoy = new Date();
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(hoy.getDate() - 7);

      // Partidos NS válidos (no suspendidos de hace más de 7 días)
      const noJugados = todos.filter((p: any) => {
        if (p.estado !== 'NS') return false;
        return new Date(p.fecha) >= haceUnaSemana;
      });

      if (noJugados.length === 0) {
        setPartidos([]);
        setCargandoPartidos(false);
        return;
      }

      // Ordenar NS por fecha
      const noJugadosOrdenados = [...noJugados].sort((a: any, b: any) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      // Detectar jornada actual usando gaps:
      // Empezamos desde el primer NS y agregamos partidos mientras el gap con el siguiente sea <= 4 días
      const GAP_MAX_DIAS = 4;
      const jornada: any[] = [noJugadosOrdenados[0]];

      for (let i = 1; i < noJugadosOrdenados.length; i++) {
        const anterior = new Date(noJugadosOrdenados[i - 1].fecha);
        const actual = new Date(noJugadosOrdenados[i].fecha);
        const diffDias = (actual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias <= GAP_MAX_DIAS) {
          jornada.push(noJugadosOrdenados[i]);
        } else {
          break; // gap grande = nueva jornada, paramos
        }
      }

      // Fecha del primer y último partido de la jornada
      const fechaInicioJornada = jornada[0].fecha.substring(0, 10);
      const fechaFinJornada = jornada[jornada.length - 1].fecha.substring(0, 10);

      // Verificar si hay algún partido FT dentro de la ventana de la jornada
      const hayIniciadoEnJornada = todos.some((p: any) => {
        if (p.estado === 'NS') return false;
        const fechaP = p.fecha.substring(0, 10);
        return fechaP >= fechaInicioJornada && fechaP <= fechaFinJornada;
      });

      if (hayIniciadoEnJornada) {
        setFechaBloqueada(true);
        setPartidos([]);
        setCargandoPartidos(false);
        return;
      }

      setPartidos(jornada);

      const init: Record<string, { local: string; visitante: string }> = {};
      jornada.forEach((_: any, i: number) => {
        init[i] = { local: '', visitante: '' };
      });
      setPredicciones(init);
    } catch (e) {
      setPartidos([]);
    }
    setCargandoPartidos(false);
  };

  const validarStep1 = () => {
    if (!nombre.trim()) { setError('El nombre de la jugada es obligatorio'); return false; }
    setError(''); return true;
  };

  const validarStep2 = () => {
    for (const v of variables) {
      if (!respuestas[v.key]) {
        setError('Completá todas las variables antes de continuar'); return false;
      }
    }
    setError(''); return true;
  };

  const validarStep3 = () => {
    if (fechaBloqueada) { setError('La fecha ya comenzó, no podés crear una jugada'); return false; }
    if (partidos.length === 0) { setError(''); return true; }
    for (let i = 0; i < partidos.length; i++) {
      const p = predicciones[i];
      if (!p || p.local === '' || p.visitante === '') {
        setError('Completá el resultado de todos los partidos'); return false;
      }
      if (isNaN(parseInt(p.local)) || isNaN(parseInt(p.visitante))) {
        setError('Los resultados deben ser números'); return false;
      }
    }
    setError(''); return true;
  };

  const guardarJugada = async () => {
    setGuardando(true);
    try {
      const prediccionesGuardadas = partidos.map((p: any, i: number) => ({
        local: p.local, visitante: p.visitante, fecha: p.fecha,
        golesLocalPredichos: parseInt(predicciones[i]?.local || '0'),
        golesVisitantePredichos: parseInt(predicciones[i]?.visitante || '0'),
      }));

      const variablesGuardadas: Record<string, any> = {};
      variables.forEach(v => {
        variablesGuardadas[v.key] = v.tipo === 'numero' ? parseInt(respuestas[v.key] || '0') : respuestas[v.key];
      });

      await addDoc(collection(db, 'jugadas'), {
        nombre: nombre.trim(),
        grupoId: grupoId || null,
        userId: user.uid,
        userEmail: user.email,
        variables: variablesGuardadas,
        variablesMeta: variables,
        predicciones: prediccionesGuardadas,
        pagado: false,
        pagadoInterno: false,
        creadoEn: serverTimestamp(),
      });
      router.push(grupoId ? `/grupo/${grupoId}` : '/inicio');
    } catch (e: any) {
      console.error('Error completo:', e);
      setError(`Error: ${e.code} - ${e.message}`);
    }
    setGuardando(false);
  };

  const setRespuesta = (key: string, valor: string) => {
    setRespuestas(prev => ({ ...prev, [key]: valor }));
  };

  const setPrediccion = (i: number, tipo: 'local' | 'visitante', valor: string) => {
    if (valor !== '' && (isNaN(Number(valor)) || Number(valor) < 0)) return;
    setPredicciones(prev => ({ ...prev, [i]: { ...prev[i], [tipo]: valor } }));
  };

  const formatHora = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFecha = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const YN = ({ varKey }: { varKey: string }) => (
    <div className="flex gap-2">
      <div onClick={() => setRespuesta(varKey, 'si')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: respuestas[varKey] === 'si' ? 'rgba(0,200,83,0.15)' : 'rgba(0,0,0,0.35)', border: respuestas[varKey] === 'si' ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.09)', color: respuestas[varKey] === 'si' ? '#00C853' : '#8892A4' }}>
        ✅ SÍ
      </div>
      <div onClick={() => setRespuesta(varKey, 'no')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: respuestas[varKey] === 'no' ? 'rgba(232,25,44,0.15)' : 'rgba(0,0,0,0.35)', border: respuestas[varKey] === 'no' ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.09)', color: respuestas[varKey] === 'no' ? '#E8192C' : '#8892A4' }}>
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

      <div style={{ background: 'linear-gradient(160deg,#0A1F5C,#0D2870)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step === 1 ? router.back() : setStep(step - 1)}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {grupo ? <b style={{ color: 'rgba(255,255,255,0.65)' }}>{grupo.nombre}</b> : 'Nueva jugada'}
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Crear Jugada</h1>
        <p className="text-xs mb-4" style={{ color: '#8892A4' }}>Paso {step} de 4</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-black text-sm flex-shrink-0"
                style={{ background: step > s ? '#00C853' : step === s ? '#E8192C' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className="flex-1 h-0.5" style={{ background: step > s ? '#00C853' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">

        {step === 1 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>Datos de la jugada</div>
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: '#8892A4' }}>Nombre de tu jugada *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mi jugada 1"
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.09)' }} />
            </div>
            {grupo && (
              <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span>👥</span>
                <div>
                  <div className="text-sm font-semibold">{grupo.nombre}</div>
                  <div className="text-xs" style={{ color: '#8892A4' }}>Tu jugada se registrará en este grupo</div>
                </div>
              </div>
            )}
            {grupo?.variablesCustom && (
              <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <span>⭐</span>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Este grupo usa <b style={{ color: '#C9A84C' }}>variables personalizadas</b> definidas por el creador.</p>
              </div>
            )}
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{background:'rgba(255,165,0,0.07)',border:'1px solid rgba(255,165,0,0.2)'}}>
              <span>⏰</span>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.6)'}}>Podés crear tu jugada hasta antes del inicio del primer partido de la fecha. Una vez comenzado el primer partido, no se podrán cargar nuevas jugadas.</p>
            </div>
            <div className="rounded-xl p-3 mb-5 flex gap-2" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Completá las variables globales, luego predecís el resultado de cada partido. Una vez enviada no se puede modificar.</p>
            </div>

            {fechaBloqueada && (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{background:'rgba(232,25,44,0.07)',border:'1px solid rgba(232,25,44,0.3)'}}>
                <div className="text-3xl mb-2">🔒</div>
                <div className="font-condensed text-lg font-black mb-1" style={{color:'#E8192C'}}>La fecha ya comenzó</div>
                <p className="text-xs" style={{color:'#8892A4'}}>No podés crear una jugada una vez que empezó el primer partido de la fecha. Volvé cuando empiece la próxima fecha.</p>
              </div>
            )}

            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}

            <button onClick={() => { if (validarStep1()) setStep(2); }}
              disabled={fechaBloqueada}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg"
              style={{ background: fechaBloqueada ? 'rgba(255,255,255,0.1)' : '#E8192C', color: fechaBloqueada ? '#8892A4' : 'white', cursor: fechaBloqueada ? 'not-allowed' : 'pointer' }}>
              {fechaBloqueada ? '🔒 FECHA BLOQUEADA' : 'SIGUIENTE →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>
              Variables de la fecha
              {grupo?.variablesCustom && <span className="ml-2 text-xs px-2 py-0.5 rounded-lg" style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>⭐ Custom</span>}
            </div>
            {variables.map((v) => (
              <div key={v.key} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>{v.label}</label>
                  <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>{v.pts} pts</span>
                </div>
                {v.tipo === 'numero' ? (
                  <input type="number" value={respuestas[v.key] || ''} onChange={(e) => setRespuesta(v.key, e.target.value)} placeholder="Ej: 0"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.35)', border: respuestas[v.key] ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                ) : (
                  <YN varKey={v.key} />
                )}
              </div>
            ))}
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span>⚠️</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Todas las respuestas aplican sobre tiempo reglamentario y alargue. No cuenta definición por penales.</p>
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={() => { if (validarStep2()) setStep(3); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3" style={{ background: '#E8192C', color: 'white' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>
              Predicciones por partido <span style={{ color: '#C9A84C' }}>· 5 pts c/u</span>
            </div>

            {cargandoPartidos && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-sm" style={{ color: '#8892A4' }}>Cargando partidos...</p>
              </div>
            )}

            {!cargandoPartidos && fechaBloqueada && (
              <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: 'rgba(232,25,44,0.07)', border: '1px solid rgba(232,25,44,0.3)' }}>
                <div className="text-4xl mb-3">🔒</div>
                <div className="font-condensed text-lg font-black mb-2" style={{ color: '#E8192C' }}>La fecha ya comenzó</div>
                <div className="text-xs" style={{ color: '#8892A4' }}>No podés crear una jugada una vez que empezó el primer partido de la fecha.</div>
              </div>
            )}

            {!cargandoPartidos && !fechaBloqueada && partidos.length === 0 && (
              <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-3xl mb-2">📅</div>
                <div className="font-condensed text-base font-bold mb-1">Sin partidos próximos</div>
                <div className="text-xs" style={{ color: '#8892A4' }}>No hay partidos disponibles para predecir en este momento</div>
              </div>
            )}

            {!cargandoPartidos && !fechaBloqueada && partidos.length > 0 && (
              <>
                <div className="text-xs mb-3 px-1" style={{ color: '#8892A4' }}>
                  📅 {formatFecha(partidos[0].fecha)} — {partidos.length} partidos
                </div>
                {partidos.map((p: any, i: number) => (
                  <div key={i} className="rounded-2xl p-4 mb-3" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-xs mb-3 text-center" style={{ color: '#8892A4' }}>{formatHora(p.fecha)}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-right">
                        <div className="text-sm font-bold mb-2">{p.local}</div>
                        <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.local || ''}
                          onChange={(e) => setPrediccion(i, 'local', e.target.value)} placeholder="0"
                          className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                          style={{ background: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.35)', border: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                      </div>
                      <div className="font-condensed text-xl font-black px-2" style={{ color: '#8892A4' }}>—</div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold mb-2">{p.visitante}</div>
                        <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.visitante || ''}
                          onChange={(e) => setPrediccion(i, 'visitante', e.target.value)} placeholder="0"
                          className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                          style={{ background: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.35)', border: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}

            <button onClick={() => { if (validarStep3()) setStep(4); }}
              disabled={fechaBloqueada}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: fechaBloqueada ? 'rgba(255,255,255,0.1)' : '#E8192C', color: fechaBloqueada ? '#8892A4' : 'white', cursor: fechaBloqueada ? 'not-allowed' : 'pointer' }}>
              {fechaBloqueada ? '🔒 FECHA BLOQUEADA' : 'SIGUIENTE →'}
            </button>
            <button onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>Confirmación</div>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-condensed text-xl font-black mb-1">{nombre}</div>
              <div className="text-xs" style={{ color: '#8892A4' }}>{grupo?.nombre || 'Sin grupo'}</div>
            </div>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>Variables</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
              {variables.map((v, i) => (
                <div key={v.key} className="flex justify-between items-center px-4 py-3"
                  style={{ borderBottom: i < variables.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span className="text-xs" style={{ color: '#8892A4' }}>{v.label}</span>
                  <span className="text-sm font-bold">
                    {v.tipo === 'sino' ? (respuestas[v.key] === 'si' ? 'SÍ' : 'NO') : respuestas[v.key]}
                  </span>
                </div>
              ))}
            </div>
            {partidos.length > 0 && (
              <>
                <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>Predicciones</div>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {partidos.map((p: any, i: number) => (
                    <div key={i} className="flex items-center px-4 py-3"
                      style={{ borderBottom: i < partidos.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div className="flex-1 text-xs font-semibold">{p.local}</div>
                      <div className="font-condensed text-base font-black px-3" style={{ color: '#C9A84C' }}>
                        {predicciones[i]?.local} - {predicciones[i]?.visitante}
                      </div>
                      <div className="flex-1 text-xs font-semibold text-right">{p.visitante}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="rounded-xl p-3 mb-5 flex gap-2" style={{ background: 'rgba(232,25,44,0.07)', border: '1px solid rgba(232,25,44,0.18)' }}>
              <span>⚠️</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Una vez confirmada la jugada <b style={{ color: 'white' }}>no se puede modificar</b>. Revisá bien antes de enviar.</p>
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={guardarJugada} disabled={guardando}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#E8192C', color: 'white', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'GUARDANDO...' : '✅ CONFIRMAR JUGADA'}
            </button>
            <button onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

      </div>
    </main>
  );
}

export default function CrearJugada() {
  return <Suspense><CrearJugadaForm /></Suspense>;
}