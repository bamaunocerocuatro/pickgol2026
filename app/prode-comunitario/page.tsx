'use client';

import { useEffect, useState, Suspense } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import LigaSelector from '../components/LigaSelector';

function ProdeComunitarioContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ligaId, setLigaId] = useState('premier');
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [miJugada, setMiJugada] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [predicciones, setPredicciones] = useState<Record<string, { local: string; visitante: string }>>({});
  const [variables, setVariables] = useState({
    amarillas: '', rojas: '', goles: '', golesMax: '', penales: '',
    hayGolAntes5: '', hayGolAlargue: '', hayCeroCero: '', varAnulaGol: ''
  });
  const [step, setStep] = useState<'ranking' | 'vars' | 'partidos' | 'confirm'>('ranking');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const ligaParam = searchParams.get('liga');
    if (ligaParam) setLigaId(ligaParam);
  }, [searchParams]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) cargarJugadas(ligaId);
  }, [ligaId, user]);

  const cargarJugadas = async (liga: string) => {
    setCargando(true);
    try {
      const q = query(
        collection(db, 'jugadas'),
        where('comunitaria', '==', true),
        where('liga', '==', liga)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.puntos || 0) - (a.puntos || 0));
      setJugadas(data);
      const mia = data.find((j: any) => j.userId === user?.uid);
      setMiJugada(mia || null);
    } catch (e) {}
    setCargando(false);
  };

  const cargarPartidos = async () => {
    try {
      const res = await fetch(`/api/fixture?liga=${ligaId}`);
      const data = await res.json();
      const todos = data.partidos || [];

      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

      // Partidos NS válidos (no suspendidos de hace más de 7 días)
      const noJugados = todos.filter((p: any) => {
        if (p.estado !== 'NS') return false;
        return new Date(p.fecha) >= haceUnaSemana;
      });

      if (noJugados.length === 0) { setPartidos([]); return; }

      // Ordenar NS por fecha
      const noJugadosOrdenados = [...noJugados].sort((a: any, b: any) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      // Detectar jornada usando gaps: agregamos partidos mientras el gap sea <= 4 días
      const GAP_MAX_DIAS = 4;
      const jornada: any[] = [noJugadosOrdenados[0]];

      for (let i = 1; i < noJugadosOrdenados.length; i++) {
        const anterior = new Date(noJugadosOrdenados[i - 1].fecha);
        const actual = new Date(noJugadosOrdenados[i].fecha);
        const diffDias = (actual.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDias <= GAP_MAX_DIAS) {
          jornada.push(noJugadosOrdenados[i]);
        } else {
          break;
        }
      }

      // Fechas de inicio y fin de la jornada
      const fechaInicioJornada = jornada[0].fecha.substring(0, 10);
      const fechaFinJornada = jornada[jornada.length - 1].fecha.substring(0, 10);

      // Verificar si hay algún partido FT dentro de la ventana de la jornada
      const hayIniciadoEnJornada = todos.some((p: any) => {
        if (p.estado === 'NS') return false;
        const fechaP = p.fecha.substring(0, 10);
        return fechaP >= fechaInicioJornada && fechaP <= fechaFinJornada;
      });

      if (hayIniciadoEnJornada) { setPartidos([]); return; }

      setPartidos(jornada);
      const init: Record<string, { local: string; visitante: string }> = {};
      jornada.forEach((_: any, i: number) => { init[i] = { local: '', visitante: '' }; });
      setPredicciones(init);
    } catch (e) { setPartidos([]); }
  };

  const validarVars = () => {
    const v = variables;
    if (!v.amarillas || !v.rojas || !v.goles || !v.golesMax || !v.penales || !v.hayGolAntes5 || !v.hayGolAlargue || !v.hayCeroCero || !v.varAnulaGol) {
      setError('Completá todas las variables'); return false;
    }
    setError(''); return true;
  };

  const validarPartidos = () => {
    for (let i = 0; i < partidos.length; i++) {
      const p = predicciones[i];
      if (!p || p.local === '' || p.visitante === '') { setError('Completá todos los resultados'); return false; }
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
      await addDoc(collection(db, 'jugadas'), {
        comunitaria: true,
        liga: ligaId,
        grupoId: null,
        nombre: `Prode Comunitario - ${ligaId}`,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0],
        variables: {
          amarillas: parseInt(variables.amarillas),
          rojas: parseInt(variables.rojas),
          goles: parseInt(variables.goles),
          golesMax: parseInt(variables.golesMax),
          penales: parseInt(variables.penales),
          hayGolAntes5: variables.hayGolAntes5,
          hayGolAlargue: variables.hayGolAlargue,
          hayCeroCero: variables.hayCeroCero,
          varAnulaGol: variables.varAnulaGol,
        },
        variablesMeta: [
          { key: 'amarillas', label: '¿Cuántas amarillas habrá?', pts: 12, tipo: 'numero' },
          { key: 'rojas', label: '¿Cuántas rojas habrá?', pts: 10, tipo: 'numero' },
          { key: 'goles', label: '¿Cuántos goles habrá en la fecha?', pts: 8, tipo: 'numero' },
          { key: 'golesMax', label: '¿Cuántos goles tendrá el partido con más goles?', pts: 10, tipo: 'numero' },
          { key: 'penales', label: '¿Cuántos penales habrá?', pts: 10, tipo: 'numero' },
          { key: 'hayGolAntes5', label: '¿Habrá un gol antes del min 5?', pts: 5, tipo: 'sino' },
          { key: 'hayGolAlargue', label: '¿Habrá gol en el alargue del 2do tiempo?', pts: 6, tipo: 'sino' },
          { key: 'hayCeroCero', label: '¿Habrá algún resultado 0-0?', pts: 2, tipo: 'sino' },
          { key: 'varAnulaGol', label: '¿El VAR anulará algún gol?', pts: 5, tipo: 'sino' },
        ],
        predicciones: prediccionesGuardadas,
        puntos: 0,
        pagado: false,
        pagadoInterno: false,
        creadoEn: serverTimestamp(),
      });
      await cargarJugadas(ligaId);
      setStep('ranking');
    } catch (e: any) {
      console.error('Error:', e);
      setError(`Error: ${e.code} - ${e.message}`);
    }
    setGuardando(false);
  };

  const setVar = (key: string, val: string) => setVariables(prev => ({ ...prev, [key]: val }));
  const setPrediccion = (i: number, tipo: 'local' | 'visitante', valor: string) => {
    if (valor !== '' && (isNaN(Number(valor)) || Number(valor) < 0)) return;
    setPredicciones(prev => ({ ...prev, [i]: { ...prev[i], [tipo]: valor } }));
  };

  const formatHora = (dateStr: string) => new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const formatFecha = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

  const YN = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-2">
      <div onClick={() => onChange('si')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: value === 'si' ? 'rgba(0,200,83,0.15)' : 'rgba(0,0,0,0.35)', border: value === 'si' ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.09)', color: value === 'si' ? '#00C853' : '#8892A4' }}>✅ SÍ</div>
      <div onClick={() => onChange('no')} className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: value === 'no' ? 'rgba(232,25,44,0.15)' : 'rgba(0,0,0,0.35)', border: value === 'no' ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.09)', color: value === 'no' ? '#E8192C' : '#8892A4' }}>❌ NO</div>
    </div>
  );

  const InputNum = ({ label, pts, value, onChange, placeholder }: any) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>{label}</label>
        <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>{pts} pts</span>
      </div>
      <input type="tel" inputMode="numeric" pattern="[0-9]*" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
        style={{ background: 'rgba(0,0,0,0.35)', border: value ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">🌍</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0A1F5C,#0D2870)' }} className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step !== 'ranking' ? setStep('ranking') : window.history.back()}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Prode Comunitario</span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-3">🌍 Prode Comunitario</h1>
        <LigaSelector value={ligaId} onChange={(id) => { setLigaId(id); setStep('ranking'); }} showMundial={false} />
      </div>

      <div className="px-4 py-4">

        {step === 'ranking' && (
          <>
            {!miJugada && (
              <button onClick={async () => { await cargarPartidos(); setStep('vars'); }}
                className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-4"
                style={{ background: '#E8192C', color: 'white' }}>
                ⚽ CREAR MI JUGADA COMUNITARIA
              </button>
            )}

            {miJugada && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-condensed text-base font-black">✅ Ya tenés jugada</div>
                    <div className="text-xs" style={{ color: '#8892A4' }}>Ya participás en el prode comunitario</div>
                  </div>
                  <div className="font-condensed text-2xl font-black" style={{ color: '#C9A84C' }}>{miJugada.puntos || 0} pts</div>
                </div>
              </div>
            )}

            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#8892A4' }}>
              Ranking — {jugadas.length} participantes
            </div>

            {cargando && (
              <div className="text-center py-8"><div className="text-3xl mb-2">⏳</div><p className="text-sm" style={{ color: '#8892A4' }}>Cargando...</p></div>
            )}

            {!cargando && jugadas.length === 0 && (
              <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-4xl mb-3">🌍</div>
                <div className="font-condensed text-lg font-bold mb-2">Sé el primero en jugar</div>
                <div className="text-xs" style={{ color: '#8892A4' }}>Todavía no hay jugadas en este prode comunitario</div>
              </div>
            )}

            {!cargando && jugadas.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                {jugadas.map((j, i) => {
                  const esMio = j.userId === user?.uid;
                  const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  return (
                    <div key={j.id} className="px-4 py-3 flex items-center gap-3"
                      style={{ borderBottom: i < jugadas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: esMio ? 'rgba(232,25,44,0.07)' : 'transparent' }}>
                      <div className="w-8 text-center flex-shrink-0">
                        {medalla ? <span className="text-xl">{medalla}</span> : <span className="font-condensed text-base font-black" style={{ color: '#8892A4' }}>#{i + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="font-condensed text-base font-bold flex items-center gap-2">
                          {j.userName || j.userEmail?.split('@')[0]}
                          {esMio && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(232,25,44,0.2)', color: '#E8192C' }}>Vos</span>}
                        </div>
                      </div>
                      <div className="font-condensed text-xl font-black" style={{ color: i === 0 ? '#C9A84C' : i === 1 ? '#A8A8A8' : i === 2 ? '#CD7F32' : '#F5F5F0' }}>
                        {j.puntos || 0} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 'vars' && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>Variables de la fecha</div>
            <InputNum label="¿Cuántas amarillas habrá?" pts={12} value={variables.amarillas} onChange={(v: string) => setVar('amarillas', v)} placeholder="Ej: 8" />
            <InputNum label="¿Cuántas rojas habrá?" pts={10} value={variables.rojas} onChange={(v: string) => setVar('rojas', v)} placeholder="Ej: 2" />
            <InputNum label="¿Cuántos goles habrá en la fecha?" pts={8} value={variables.goles} onChange={(v: string) => setVar('goles', v)} placeholder="Ej: 12" />
            <InputNum label="¿Cuántos goles tendrá el partido con más goles?" pts={10} value={variables.golesMax} onChange={(v: string) => setVar('golesMax', v)} placeholder="Ej: 4" />
            <InputNum label="¿Cuántos penales habrá?" pts={10} value={variables.penales} onChange={(v: string) => setVar('penales', v)} placeholder="Ej: 2" />
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>¿Habrá un gol antes del min 5?</label>
                <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>5 pts</span>
              </div>
              <YN value={variables.hayGolAntes5} onChange={(v) => setVar('hayGolAntes5', v)} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>¿Habrá gol en el alargue del 2do tiempo?</label>
                <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>6 pts</span>
              </div>
              <YN value={variables.hayGolAlargue} onChange={(v) => setVar('hayGolAlargue', v)} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>¿Habrá algún resultado 0-0?</label>
                <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>2 pts</span>
              </div>
              <YN value={variables.hayCeroCero} onChange={(v) => setVar('hayCeroCero', v)} />
            </div>
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892A4' }}>¿El VAR anulará algún gol?</label>
                <span className="text-xs font-black" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', padding: '2px 8px', borderRadius: '6px' }}>5 pts</span>
              </div>
              <YN value={variables.varAnulaGol} onChange={(v) => setVar('varAnulaGol', v)} />
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={() => { if (validarVars()) setStep('partidos'); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3" style={{ background: '#E8192C', color: 'white' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => setStep('ranking')}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {step === 'partidos' && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#8892A4' }}>
              Predicciones por partido <span style={{ color: '#C9A84C' }}>· 5 pts c/u</span>
            </div>
            {partidos.length === 0 && (
              <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-3xl mb-2">📅</div>
                <div className="font-condensed text-base font-bold mb-1">Sin partidos próximos</div>
                <div className="text-xs" style={{ color: '#8892A4' }}>No hay partidos disponibles para predecir</div>
              </div>
            )}
            {partidos.length > 0 && (
              <>
                <div className="text-xs mb-3 px-1" style={{ color: '#8892A4' }}>📅 {formatFecha(partidos[0].fecha)} — {partidos.length} partidos</div>
                {partidos.map((p: any, i: number) => (
                  <div key={i} className="rounded-2xl p-4 mb-3" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-xs mb-3 text-center" style={{ color: '#8892A4' }}>{formatHora(p.fecha)}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-right">
                        <div className="text-sm font-bold mb-2">{p.local}</div>
                        <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.local || ''} onChange={(e) => setPrediccion(i, 'local', e.target.value)} placeholder="0"
                          className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                          style={{ background: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.35)', border: predicciones[i]?.local !== '' && predicciones[i]?.local !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                      </div>
                      <div className="font-condensed text-xl font-black px-2" style={{ color: '#8892A4' }}>—</div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold mb-2">{p.visitante}</div>
                        <input type="tel" inputMode="numeric" pattern="[0-9]*" value={predicciones[i]?.visitante || ''} onChange={(e) => setPrediccion(i, 'visitante', e.target.value)} placeholder="0"
                          className="w-full rounded-xl px-3 py-2 text-white text-lg font-black text-center outline-none"
                          style={{ background: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? 'rgba(0,200,83,0.1)' : 'rgba(0,0,0,0.35)', border: predicciones[i]?.visitante !== '' && predicciones[i]?.visitante !== undefined ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={() => { if (validarPartidos()) setStep('confirm'); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3" style={{ background: '#E8192C', color: 'white' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => setStep('vars')}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-condensed text-xl font-black mb-1">Prode Comunitario</div>
              <div className="text-xs" style={{ color: '#8892A4' }}>{ligaId} · Todos contra todos</div>
            </div>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#8892A4' }}>Variables</div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { label: '🟨 Amarillas', value: variables.amarillas },
                { label: '🟥 Rojas', value: variables.rojas },
                { label: '⚽ Goles totales', value: variables.goles },
                { label: '🎯 Goles partido máx', value: variables.golesMax },
                { label: '🎽 Penales', value: variables.penales },
                { label: '⚡ Gol antes min 5', value: variables.hayGolAntes5 === 'si' ? 'SÍ' : 'NO' },
                { label: '⏱️ Gol en alargue', value: variables.hayGolAlargue === 'si' ? 'SÍ' : 'NO' },
                { label: '🥅 Resultado 0-0', value: variables.hayCeroCero === 'si' ? 'SÍ' : 'NO' },
                { label: '📺 VAR anula gol', value: variables.varAnulaGol === 'si' ? 'SÍ' : 'NO' },
              ].map((item, i, arr) => (
                <div key={i} className="flex justify-between items-center px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span className="text-xs" style={{ color: '#8892A4' }}>{item.label}</span>
                  <span className="text-sm font-bold">{item.value}</span>
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
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Una vez confirmada <b style={{ color: 'white' }}>no se puede modificar</b>.</p>
            </div>
            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={guardarJugada} disabled={guardando}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#E8192C', color: 'white', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'GUARDANDO...' : '✅ CONFIRMAR JUGADA'}
            </button>
            <button onClick={() => setStep('partidos')}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F0' }}>
              ← ATRÁS
            </button>
          </>
        )}

      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/inicio'}>
          <span className="text-lg">🏠</span><span className="text-xs font-semibold" style={{ color: '#8892A4' }}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/fixture'}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: '#8892A4' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/grupos'}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{ color: '#8892A4' }}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/mis-jugadas'}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{ color: '#8892A4' }}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/perfil'}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{ color: '#8892A4' }}>Perfil</span>
        </div>
      </div>

    </main>
  );
}

export default function ProdeComunitario() {
  return (
    <Suspense>
      <ProdeComunitarioContent />
    </Suspense>
  );
}