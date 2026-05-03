'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const FECHA_BLOQUEO = new Date('2026-06-09T17:00:00-03:00');

function ProdeComunitarioMundialContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [miJugada, setMiJugada] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [predicciones, setPredicciones] = useState<Record<string, { local: string; visitante: string }>>({});
  const [step, setStep] = useState<'ranking' | 'partidos' | 'confirm'>('ranking');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const bloqueado = new Date() >= FECHA_BLOQUEO;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) cargarJugadas();
  }, [user]);

  const cargarJugadas = async () => {
    setCargando(true);
    try {
      const q = query(collection(db, 'jugadas_comunitarias_mundial'), where('tipo', '==', 'mundial2026'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      data.sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
      setJugadas(data);
      const mia = data.find((j: any) => j.userId === user?.uid);
      setMiJugada(mia || null);
    } catch (e) {}
    setCargando(false);
  };

  const cargarPartidos = async () => {
    try {
      const res = await fetch('/api/mundial/fixture');
      const data = await res.json();
      const porJugar = (data.partidos || []).filter((p: any) => p.estado === 'NS');
      setPartidos(porJugar);
      const init: Record<string, { local: string; visitante: string }> = {};
      porJugar.forEach((_: any, i: number) => { init[i] = { local: '', visitante: '' }; });
      setPredicciones(init);
    } catch (e) { setPartidos([]); }
  };

  const validarPartidos = () => {
    if (partidos.length === 0) { setError('No hay partidos disponibles'); return false; }
    const faltantes = partidos.filter((_, idx) => {
      const pred = predicciones[idx];
      return !pred || pred.local === '' || pred.visitante === '';
    }).length;
    if (faltantes > 0) {
      setError(`Faltan ${faltantes} partido${faltantes !== 1 ? 's' : ''} sin completar — están marcados en rojo`);
      return false;
    }
    setError(''); return true;
  };

  const guardarJugada = async () => {
    setGuardando(true);
    try {
      const prediccionesGuardadas = partidos.map((p: any, i: number) => ({
        id: p.id, local: p.local, visitante: p.visitante, fecha: p.fecha,
        golesLocalPredichos: parseInt(predicciones[i]?.local || '0'),
        golesVisitantePredichos: parseInt(predicciones[i]?.visitante || '0'),
        puntos: 0,
      }));
      await addDoc(collection(db, 'jugadas_comunitarias_mundial'), {
        tipo: 'mundial2026',
        nombre: 'Prode Comunitario Mundial 2026',
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0],
        predicciones: prediccionesGuardadas,
        puntos: 0,
        creadoEn: serverTimestamp(),
      });
      await cargarJugadas();
      setStep('ranking');
    } catch (e: any) { setError(`Error: ${e.message}`); }
    setGuardando(false);
  };

  const setPrediccion = (i: number, tipo: 'local' | 'visitante', valor: string) => {
    if (valor !== '' && (isNaN(Number(valor)) || Number(valor) < 0)) return;
    setPredicciones(prev => ({ ...prev, [i]: { ...prev[i], [tipo]: valor } }));
  };

  const formatHora = (dateStr: string) => new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const formatFecha = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });

  const partidosPorFecha: Record<string, number[]> = {};
  partidos.forEach((p: any, i: number) => {
    const fecha = new Date(p.fecha).toISOString().split('T')[0];
    if (!partidosPorFecha[fecha]) partidosPorFecha[fecha] = [];
    partidosPorFecha[fecha].push(i);
  });

  const estaIncompleto = (i: number) => {
    const p = predicciones[i];
    return !p || p.local === '' || p.visitante === '';
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">🌍</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step !== 'ranking' ? setStep('ranking') : router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Prode Comunitario</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>🌍 PRODE COMUNITARIO</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Todos contra todos · Gratis</p>
      </div>

      <div className="px-4 py-4">

        {step === 'ranking' && (
          <>
            {!miJugada && !bloqueado && (
              <button onClick={async () => { await cargarPartidos(); setStep('partidos'); }}
                className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-4"
                style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
                ⚽ CREAR MI JUGADA
              </button>
            )}
            {bloqueado && !miJugada && (
              <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="text-3xl mb-2">🔒</div>
                <div className="font-condensed text-lg font-black mb-1" style={{ color: '#C8AA6E' }}>Jugadas cerradas</div>
                <p className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Las jugadas se cerraron antes del inicio del Mundial.</p>
              </div>
            )}
            {miJugada && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(200,170,110,0.07)', border: '1px solid rgba(200,170,110,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>✅ Ya participás</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Fase de Grupos</div>
                  </div>
                  <div className="font-condensed text-2xl font-black" style={{ color: '#C8AA6E' }}>{miJugada.puntos || 0} pts</div>
                </div>
              </div>
            )}
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(200,170,110,0.04)', border: '1px solid rgba(200,170,110,0.12)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)' }}>Una sola jugada por usuario para toda la fase de grupos. Sin variables, solo resultados. <b style={{ color: '#F5F5F0' }}>Gratis.</b></p>
            </div>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(210,185,130,0.6)' }}>
              Ranking global · {jugadas.length} participantes
            </div>
            {cargando && <div className="text-center py-8"><div className="text-3xl mb-2">⏳</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p></div>}
            {!cargando && jugadas.length === 0 && (
              <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="text-4xl mb-3">🌍</div>
                <div className="font-condensed text-lg font-bold mb-2" style={{ color: '#F5F5F0' }}>Sé el primero en jugar</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Todavía no hay jugadas en el prode comunitario del Mundial</div>
              </div>
            )}
            {!cargando && jugadas.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                {jugadas.map((j, i) => {
                  const esMio = j.userId === user?.uid;
                  const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  return (
                    <div key={j.id} className="px-4 py-3 flex items-center gap-3"
                      style={{ borderBottom: i < jugadas.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none', background: esMio ? 'rgba(200,170,110,0.05)' : 'transparent' }}>
                      <div className="w-8 text-center flex-shrink-0">
                        {medalla ? <span className="text-xl">{medalla}</span> : <span className="font-condensed text-base font-black" style={{ color: 'rgba(210,185,130,0.45)' }}>#{i + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="font-condensed text-base font-bold flex items-center gap-2" style={{ color: esMio ? '#C8AA6E' : '#F5F5F0' }}>
                          {j.userName || j.userEmail?.split('@')[0]}
                          {esMio && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E' }}>Vos</span>}
                        </div>
                      </div>
                      <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{j.puntos || 0} pts</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 'partidos' && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>
              Predicciones · <span style={{ color: '#C8AA6E' }}>5 pts c/u · {partidos.length} partidos</span>
            </div>
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.12)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)' }}>Predecís el resultado de <b style={{ color: '#F5F5F0' }}>todos los partidos</b> de la fase de grupos de una sola vez.</p>
            </div>

            {partidos.length === 0 && (
              <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="text-3xl mb-2">📅</div>
                <div className="font-condensed text-base font-bold mb-1" style={{ color: '#F5F5F0' }}>Sin partidos disponibles</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>El fixture aún no está disponible en la API</div>
              </div>
            )}

            {Object.entries(partidosPorFecha).map(([fecha, indices]) => (
              <div key={fecha} className="mb-4">
                <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>
                  {formatFecha(fecha + 'T12:00:00')}
                </div>
                {indices.map((i) => {
                  const p = partidos[i];
                  const incompleto = estaIncompleto(i);
                  return (
                    <div key={i} className="rounded-2xl p-4 mb-2"
                      style={{ background: '#0D1B3E', border: incompleto && error ? '1px solid rgba(232,25,44,0.5)' : '1px solid rgba(200,170,110,0.15)', transition: 'border .3s' }}>
                      <div className="text-xs mb-3 text-center" style={{ color: 'rgba(210,185,130,0.6)' }}>{formatHora(p.fecha)}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-right">
                          <div className="flex items-center justify-end gap-2 mb-2">
                            {p.localLogo && <img src={p.localLogo} alt={p.local} className="w-5 h-5 object-contain" />}
                            <span className="text-sm font-bold" style={{ color: '#F5F5F0' }}>{p.local}</span>
                          </div>
                          <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.local || ''}
                            onChange={(e) => setPrediccion(i, 'local', e.target.value)} placeholder="-"
                            className="w-full rounded-xl px-3 py-2 text-lg font-black text-center outline-none"
                            style={{ background: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? 'rgba(200,170,110,0.12)' : 'rgba(200,170,110,0.04)', border: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? '1px solid rgba(200,170,110,0.4)' : '1px solid rgba(200,170,110,0.15)', color: '#C8AA6E' }} />
                        </div>
                        <div className="font-condensed text-xl font-black px-2" style={{ color: 'rgba(210,185,130,0.4)' }}>—</div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            {p.visitanteLogo && <img src={p.visitanteLogo} alt={p.visitante} className="w-5 h-5 object-contain" />}
                            <span className="text-sm font-bold" style={{ color: '#F5F5F0' }}>{p.visitante}</span>
                          </div>
                          <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.visitante || ''}
                            onChange={(e) => setPrediccion(i, 'visitante', e.target.value)} placeholder="-"
                            className="w-full rounded-xl px-3 py-2 text-lg font-black text-center outline-none"
                            style={{ background: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? 'rgba(200,170,110,0.12)' : 'rgba(200,170,110,0.04)', border: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? '1px solid rgba(200,170,110,0.4)' : '1px solid rgba(200,170,110,0.15)', color: '#C8AA6E' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {error && (
              <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(232,25,44,0.08)', border: '1px solid rgba(232,25,44,0.3)' }}>
                <span>⚠️</span>
                <p className="text-xs font-semibold" style={{ color: '#E8192C' }}>{error}</p>
              </div>
            )}
            <button onClick={() => { if (validarPartidos()) setStep('confirm'); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => setStep('ranking')} className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(200,170,110,0.07)', border: '1px solid rgba(200,170,110,0.2)' }}>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-condensed text-xl font-black mb-1" style={{ color: '#C8AA6E' }}>Prode Comunitario</div>
              <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Fase de Grupos · {partidos.length} partidos</div>
            </div>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>Predicciones ({partidos.length} partidos)</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              {partidos.map((p: any, i: number) => (
                <div key={i} className="flex items-center px-4 py-2" style={{ borderBottom: i < partidos.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none' }}>
                  <div className="flex-1 text-xs font-semibold truncate" style={{ color: '#F5F5F0' }}>{p.local}</div>
                  <div className="font-condensed text-base font-black px-3 flex-shrink-0" style={{ color: '#C8AA6E' }}>{predicciones[i]?.local} - {predicciones[i]?.visitante}</div>
                  <div className="flex-1 text-xs font-semibold text-right truncate" style={{ color: '#F5F5F0' }}>{p.visitante}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3 mb-5 flex gap-2" style={{ background: 'rgba(232,25,44,0.06)', border: '1px solid rgba(232,25,44,0.15)' }}>
              <span>⚠️</span>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)' }}>Una vez confirmada <b style={{ color: '#F5F5F0' }}>no se puede modificar</b>.</p>
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={guardarJugada} disabled={guardando}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#C8AA6E', color: '#0d0d1a', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'GUARDANDO...' : '✅ CONFIRMAR JUGADA'}
            </button>
            <button onClick={() => setStep('partidos')} className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
              ← ATRÁS
            </button>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏆</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Mundial</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/grupos')}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/mis-jugadas')}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{ color: '#C8AA6E' }}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Perfil</span>
        </div>
      </div>

    </main>
  );
}

export default function ProdeComunitarioMundial() {
  return <Suspense><ProdeComunitarioMundialContent /></Suspense>;
}
