'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

const VARIABLES_DEFAULT = [
  { key: 'amarillas', label: '¿Cuántas amarillas habrá en toda la fase de grupos?', pts: 12, tipo: 'numero' },
  { key: 'rojas', label: '¿Cuántas rojas habrá en toda la fase de grupos?', pts: 10, tipo: 'numero' },
  { key: 'goles', label: '¿Cuántos goles habrá en total en la fase de grupos?', pts: 8, tipo: 'numero' },
  { key: 'golesMax', label: '¿Cuántos goles tendrá el partido con más goles?', pts: 10, tipo: 'numero' },
  { key: 'penales', label: '¿Cuántos penales habrá en la fase de grupos?', pts: 10, tipo: 'numero' },
  { key: 'hayGolAntes5', label: '¿Habrá un gol antes del min 5 en algún partido?', pts: 5, tipo: 'sino' },
  { key: 'hayGolAlargue', label: '¿Habrá gol en el alargue del 2do tiempo?', pts: 6, tipo: 'sino' },
  { key: 'hayCeroCero', label: '¿Habrá algún resultado 0-0?', pts: 2, tipo: 'sino' },
  { key: 'varAnulaGol', label: '¿El VAR anulará algún gol?', pts: 5, tipo: 'sino' },
];

// Bloqueo global: 48hs antes del primer partido (11 junio 17hs Argentina)
const FECHA_BLOQUEO = new Date('2026-06-09T17:00:00-03:00');

function CrearJugadaMundialForm() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [variables, setVariables] = useState<any[]>(VARIABLES_DEFAULT);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [partidos, setPartidos] = useState<any[]>([]);
  const [predicciones, setPredicciones] = useState<Record<string, { local: string; visitante: string }>>({});
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [verificandoPago, setVerificandoPago] = useState(false);
  const searchParams = useSearchParams();
  const grupoId = searchParams.get('grupo');

  const bloqueado = new Date() >= FECHA_BLOQUEO;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const usnap = await getDoc(doc(db, 'usuarios', u.uid));
        if (usnap.exists()) setUserData(usnap.data());
      } catch (e) {}
      if (grupoId) {
        try {
          const snap = await getDoc(doc(db, 'grupos_mundial', grupoId));
          if (snap.exists()) {
            const grupoData = { id: snap.id, ...snap.data() } as any;
            setGrupo(grupoData);
            if (grupoData.variablesCustom && grupoData.variablesCustom.length > 0) {
              setVariables(grupoData.variablesCustom);
            }
          }
        } catch (e) {}
      }
      setLoading(false);
    });
    return () => unsub();
  }, [grupoId]);

  useEffect(() => {
    if (!loading && step === 3) cargarPartidos();
  }, [step, loading]);

  const cargarPartidos = async () => {
    setCargandoPartidos(true);
    try {
      const res = await fetch('/api/mundial/fixture');
      const data = await res.json();
      const todos = data.partidos || [];
      // Todos los partidos NS (por jugar) de la fase de grupos
      const porJugar = todos.filter((p: any) => p.estado === 'NS');
      setPartidos(porJugar);
      const init: Record<string, { local: string; visitante: string }> = {};
      porJugar.forEach((_: any, i: number) => {
        init[i] = { local: '', visitante: '' };
      });
      setPredicciones(init);
    } catch (e) {
      setPartidos([]);
    }
    setCargandoPartidos(false);
  };

  // Verificar si el usuario puede crear jugada
  const puedeCrear = async (): Promise<{ ok: boolean; motivo?: string }> => {
    setVerificandoPago(true);
    try {
      // Plus: jugadas ilimitadas
      if (userData?.plus) { setVerificandoPago(false); return { ok: true }; }

      // Contar jugadas existentes del usuario en este grupo (o comunitarias)
      const coleccion = grupoId ? 'jugadas_mundial' : 'jugadas_comunitarias_mundial';
      const filtro = grupoId
        ? query(collection(db, coleccion), where('userId', '==', user.uid), where('grupoId', '==', grupoId))
        : query(collection(db, coleccion), where('userId', '==', user.uid));

      const snap = await getDocs(filtro);
      const jugadasExistentes = snap.docs.length;

      // 1 gratis
      const jugadasGratis = userData?.jugadasMundialGratis ?? 1;
      if (jugadasExistentes < jugadasGratis) { setVerificandoPago(false); return { ok: true }; }

      // Verificar si tiene jugadas pagas disponibles
      const jugadasPagas = userData?.jugadasMundialPagas ?? 0;
      const jugadasUsadas = jugadasExistentes - jugadasGratis;
      if (jugadasUsadas < jugadasPagas) { setVerificandoPago(false); return { ok: true }; }

      setVerificandoPago(false);
      return { ok: false, motivo: 'Sin jugadas disponibles. Comprá una jugada extra o activá Plus.' };
    } catch (e) {
      setVerificandoPago(false);
      return { ok: true }; // En caso de error dejamos pasar
    }
  };

  const validarStep1 = () => {
    if (!nombre.trim()) { setError('El nombre de la jugada es obligatorio'); return false; }
    setError(''); return true;
  };

  const validarStep2 = () => {
    for (const v of variables) {
      if (!respuestas[v.key]) { setError('Completá todas las variables antes de continuar'); return false; }
    }
    setError(''); return true;
  };

  const validarStep3 = () => {
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

  const handleSiguienteStep1 = async () => {
    if (!validarStep1()) return;
    const { ok, motivo } = await puedeCrear();
    if (!ok) { setError(motivo || 'No podés crear más jugadas'); return; }
    setStep(2);
  };

  const guardarJugada = async () => {
    setGuardando(true);
    try {
      const prediccionesGuardadas = partidos.map((p: any, i: number) => ({
        id: p.id,
        local: p.local,
        visitante: p.visitante,
        fecha: p.fecha,
        golesLocalPredichos: parseInt(predicciones[i]?.local || '0'),
        golesVisitantePredichos: parseInt(predicciones[i]?.visitante || '0'),
        puntos: 0,
      }));

      const variablesGuardadas: Record<string, any> = {};
      variables.forEach(v => {
        variablesGuardadas[v.key] = v.tipo === 'numero' ? parseInt(respuestas[v.key] || '0') : respuestas[v.key];
      });

      const coleccion = grupoId ? 'jugadas_mundial' : 'jugadas_comunitarias_mundial';

      await addDoc(collection(db, coleccion), {
        nombre: nombre.trim(),
        grupoId: grupoId || null,
        userId: user.uid,
        userEmail: user.email,
        variables: variablesGuardadas,
        variablesMeta: variables,
        predicciones: prediccionesGuardadas,
        puntos: 0,
        pagado: false,
        pagadoInterno: false,
        tipo: 'mundial2026',
        creadoEn: serverTimestamp(),
      });

      router.push(grupoId ? `/mundial/grupo/${grupoId}` : '/mundial');
    } catch (e: any) {
      setError(`Error: ${e.message}`);
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
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  };

  const formatFecha = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' });
  };

  // Agrupar partidos por fecha para el step 3
  const partidosPorFecha: Record<string, number[]> = {};
  partidos.forEach((p: any, i: number) => {
    const fecha = new Date(p.fecha).toISOString().split('T')[0];
    if (!partidosPorFecha[fecha]) partidosPorFecha[fecha] = [];
    partidosPorFecha[fecha].push(i);
  });

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
      <div className="text-center"><div className="text-5xl mb-3">🏆</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#7B0000,#E8192C,#C8102E)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step === 1 ? router.back() : setStep(step - 1)}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {grupo ? <b style={{ color: 'rgba(255,255,255,0.8)' }}>{grupo.nombre}</b> : 'Nueva jugada Mundial'}
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">🏆 Crear Jugada</h1>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Mundial 2026 · Paso {step} de 4</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-black text-sm flex-shrink-0"
                style={{ background: step > s ? '#00C853' : step === s ? 'white' : 'rgba(255,255,255,0.2)', color: step === s ? '#E8192C' : 'white' }}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className="flex-1 h-0.5" style={{ background: step > s ? '#00C853' : 'rgba(255,255,255,0.2)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">

        {/* BLOQUEO GLOBAL */}
        {bloqueado && (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(232,25,44,0.07)', border: '1px solid rgba(232,25,44,0.3)' }}>
            <div className="text-4xl mb-3">🔒</div>
            <div className="font-condensed text-xl font-black mb-2" style={{ color: '#E8192C' }}>Jugadas cerradas</div>
            <p className="text-sm" style={{ color: '#8892A4' }}>Las jugadas se cerraron 48 horas antes del inicio del Mundial. Ya no es posible crear nuevas jugadas.</p>
          </div>
        )}

        {/* STEP 1 — NOMBRE */}
        {!bloqueado && step === 1 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>Datos de la jugada</div>
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: '#8892A4' }}>Nombre de tu jugada *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mi jugada Mundial"
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
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(255,165,0,0.07)', border: '1px solid rgba(255,165,0,0.2)' }}>
              <span>⏰</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Podés crear tu jugada hasta el <b style={{ color: 'white' }}>9 de junio a las 17hs (ARG)</b>. Después de esa hora se cierran todas las jugadas.
              </p>
            </div>
            <div className="rounded-xl p-3 mb-5 flex gap-2" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Vas a predecir las variables globales de la fase de grupos y el resultado de <b style={{ color: 'white' }}>todos los partidos</b>. Una vez enviada no se puede modificar.
              </p>
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={handleSiguienteStep1} disabled={verificandoPago}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg"
              style={{ background: '#E8192C', color: 'white', opacity: verificandoPago ? 0.7 : 1 }}>
              {verificandoPago ? 'VERIFICANDO...' : 'SIGUIENTE →'}
            </button>
          </>
        )}

        {/* STEP 2 — VARIABLES */}
        {!bloqueado && step === 2 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>
              Variables de la fase de grupos
              {grupo?.variablesCustom && <span className="ml-2 text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>⭐ Custom</span>}
            </div>
            {variables.map((v) => (
              <div key={v.key} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>{v.label}</label>
                  <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>{v.pts} pts</span>
                </div>
                {v.tipo === 'numero' ? (
                  <input type="number" value={respuestas[v.key] || ''} onChange={(e) => setRespuesta(v.key, e.target.value)} placeholder="0"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.35)', border: respuestas[v.key] ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                ) : (
                  <YN varKey={v.key} />
                )}
              </div>
            ))}
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span>⚠️</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Todas las respuestas aplican sobre tiempo reglamentario. No cuenta definición por penales.</p>
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={() => { if (validarStep2()) setStep(3); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3" style={{ background: '#E8192C', color: 'white' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {/* STEP 3 — PREDICCIONES */}
        {!bloqueado && step === 3 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>
              Predicciones · <span style={{ color: '#C9A84C' }}>5 pts c/u · {partidos.length} partidos</span>
            </div>
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Predecís el resultado de <b style={{ color: 'white' }}>todos los partidos</b> de la fase de grupos de una sola vez.</p>
            </div>

            {cargandoPartidos && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-sm" style={{ color: '#8892A4' }}>Cargando partidos...</p>
              </div>
            )}

            {!cargandoPartidos && partidos.length === 0 && (
              <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-3xl mb-2">📅</div>
                <div className="font-condensed text-base font-bold mb-1">Sin partidos disponibles</div>
                <div className="text-xs" style={{ color: '#8892A4' }}>El fixture del Mundial aún no está disponible en la API</div>
              </div>
            )}

            {!cargandoPartidos && Object.entries(partidosPorFecha).map(([fecha, indices]) => (
              <div key={fecha} className="mb-4">
                <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>
                  {formatFecha(fecha + 'T12:00:00')}
                </div>
                {indices.map((i) => {
                  const p = partidos[i];
                  return (
                    <div key={i} className="rounded-2xl p-4 mb-2" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="text-xs mb-3 text-center" style={{ color: '#8892A4' }}>{formatHora(p.fecha)} · {p.venue || ''}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-end gap-2 mb-2">
                            {p.localLogo && <img src={p.localLogo} alt={p.local} className="w-5 h-5 object-contain" />}
                            <span className="text-sm font-bold">{p.local}</span>
                          </div>
                          <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.local || ''}
                            onChange={(e) => setPrediccion(i, 'local', e.target.value)} placeholder="-"
                            className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                            style={{ background: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.35)', border: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                        </div>
                        <div className="font-condensed text-xl font-black px-2" style={{ color: '#8892A4' }}>—</div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            {p.visitanteLogo && <img src={p.visitanteLogo} alt={p.visitante} className="w-5 h-5 object-contain" />}
                            <span className="text-sm font-bold">{p.visitante}</span>
                          </div>
                          <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.visitante || ''}
                            onChange={(e) => setPrediccion(i, 'visitante', e.target.value)} placeholder="-"
                            className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                            style={{ background: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.35)', border: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={() => { if (validarStep3()) setStep(4); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#E8192C', color: 'white' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {/* STEP 4 — CONFIRMACIÓN */}
        {!bloqueado && step === 4 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>Confirmación</div>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-condensed text-xl font-black mb-1">{nombre}</div>
              <div className="text-xs" style={{ color: '#8892A4' }}>{grupo?.nombre || 'Mundial 2026 · Prode Comunitario'}</div>
            </div>

            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>Variables</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
              {variables.map((v, i) => (
                <div key={v.key} className="flex justify-between items-center px-4 py-3"
                  style={{ borderBottom: i < variables.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span className="text-xs flex-1 mr-2" style={{ color: '#8892A4' }}>{v.label}</span>
                  <span className="text-sm font-bold flex-shrink-0">
                    {v.tipo === 'sino' ? (respuestas[v.key] === 'si' ? 'SÍ' : 'NO') : respuestas[v.key]}
                  </span>
                </div>
              ))}
            </div>

            {partidos.length > 0 && (
              <>
                <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>
                  Predicciones ({partidos.length} partidos)
                </div>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {partidos.map((p: any, i: number) => (
                    <div key={i} className="flex items-center px-4 py-2"
                      style={{ borderBottom: i < partidos.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div className="flex-1 text-xs font-semibold truncate">{p.local}</div>
                      <div className="font-condensed text-base font-black px-3 flex-shrink-0" style={{ color: '#C9A84C' }}>
                        {predicciones[i]?.local} - {predicciones[i]?.visitante}
                      </div>
                      <div className="flex-1 text-xs font-semibold text-right truncate">{p.visitante}</div>
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
            <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

      </div>
    </main>
  );
}

export default function CrearJugadaMundial() {
  return <Suspense><CrearJugadaMundialForm /></Suspense>;
}