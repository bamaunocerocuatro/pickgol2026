'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const PAISES_MUNDIAL = [
  { nombre: 'Alemania', flag: '🇩🇪' },
  { nombre: 'Arabia Saudita', flag: '🇸🇦' },
  { nombre: 'Argelia', flag: '🇩🇿' },
  { nombre: 'Argentina', flag: '🇦🇷' },
  { nombre: 'Australia', flag: '🇦🇺' },
  { nombre: 'Austria', flag: '🇦🇹' },
  { nombre: 'Bélgica', flag: '🇧🇪' },
  { nombre: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  { nombre: 'Brasil', flag: '🇧🇷' },
  { nombre: 'Cabo Verde', flag: '🇨🇻' },
  { nombre: 'Canadá', flag: '🇨🇦' },
  { nombre: 'Colombia', flag: '🇨🇴' },
  { nombre: 'Corea del Sur', flag: '🇰🇷' },
  { nombre: 'Costa de Marfil', flag: '🇨🇮' },
  { nombre: 'Croacia', flag: '🇭🇷' },
  { nombre: 'Curazao', flag: '🇨🇼' },
  { nombre: 'Ecuador', flag: '🇪🇨' },
  { nombre: 'Egipto', flag: '🇪🇬' },
  { nombre: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { nombre: 'España', flag: '🇪🇸' },
  { nombre: 'Estados Unidos', flag: '🇺🇸' },
  { nombre: 'Francia', flag: '🇫🇷' },
  { nombre: 'Ghana', flag: '🇬🇭' },
  { nombre: 'Haití', flag: '🇭🇹' },
  { nombre: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { nombre: 'Irán', flag: '🇮🇷' },
  { nombre: 'Irak', flag: '🇮🇶' },
  { nombre: 'Japón', flag: '🇯🇵' },
  { nombre: 'Jordania', flag: '🇯🇴' },
  { nombre: 'Marruecos', flag: '🇲🇦' },
  { nombre: 'México', flag: '🇲🇽' },
  { nombre: 'Noruega', flag: '🇳🇴' },
  { nombre: 'Nueva Zelanda', flag: '🇳🇿' },
  { nombre: 'Países Bajos', flag: '🇳🇱' },
  { nombre: 'Panamá', flag: '🇵🇦' },
  { nombre: 'Paraguay', flag: '🇵🇾' },
  { nombre: 'Portugal', flag: '🇵🇹' },
  { nombre: 'Qatar', flag: '🇶🇦' },
  { nombre: 'República Checa', flag: '🇨🇿' },
  { nombre: 'República Democrática del Congo', flag: '🇨🇩' },
  { nombre: 'Senegal', flag: '🇸🇳' },
  { nombre: 'Sudáfrica', flag: '🇿🇦' },
  { nombre: 'Suecia', flag: '🇸🇪' },
  { nombre: 'Suiza', flag: '🇨🇭' },
  { nombre: 'Túnez', flag: '🇹🇳' },
  { nombre: 'Turquía', flag: '🇹🇷' },
  { nombre: 'Uruguay', flag: '🇺🇾' },
  { nombre: 'Uzbekistán', flag: '🇺🇿' },
];

const FECHA_BLOQUEO = new Date('2027-06-09T17:00:00-03:00');

function EditarJugadaMundialForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jugadaId = searchParams.get('jugada');
  const esComunitaria = searchParams.get('comunitaria') === '1';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jugada, setJugada] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [predicciones, setPredicciones] = useState<Record<string, { local: string; visitante: string }>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const bloqueado = new Date() >= FECHA_BLOQUEO;
  const coleccion = esComunitaria ? 'jugadas_comunitarias_mundial' : 'jugadas_mundial';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      if (jugadaId) {
        try {
          const snap = await getDoc(doc(db, coleccion, jugadaId));
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as any;
            setJugada(data);
            setNombre(data.nombre || '');
            const resp: Record<string, string> = {};
            if (data.variablesMeta && data.variables) {
              data.variablesMeta.forEach((v: any) => {
                resp[v.key] = String(data.variables[v.key] ?? '');
              });
            }
            setRespuestas(resp);
            const preds: Record<string, { local: string; visitante: string }> = {};
            if (data.predicciones) {
              data.predicciones.forEach((p: any, i: number) => {
                preds[i] = {
                  local: String(p.golesLocalPredichos ?? ''),
                  visitante: String(p.golesVisitantePredichos ?? ''),
                };
              });
            }
            setPredicciones(preds);
          }
        } catch (e) { console.error(e); }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [jugadaId]);

  const guardarCambios = async () => {
    if (!jugada) return;
    setGuardando(true);
    try {
      const prediccionesActualizadas = jugada.predicciones.map((p: any, i: number) => ({
        ...p,
        golesLocalPredichos: parseInt(predicciones[i]?.local || '0'),
        golesVisitantePredichos: parseInt(predicciones[i]?.visitante || '0'),
      }));

      const variablesActualizadas: Record<string, any> = {};
      if (jugada.variablesMeta) {
        jugada.variablesMeta.forEach((v: any) => {
          variablesActualizadas[v.key] = v.tipo === 'numero'
            ? parseInt(respuestas[v.key] || '0')
            : respuestas[v.key];
        });
      }

      const updates: any = {
        predicciones: prediccionesActualizadas,
        actualizadoEn: serverTimestamp(),
      };

      if (!esComunitaria) {
        updates.nombre = nombre.trim();
        updates.variables = variablesActualizadas;
      }

      await updateDoc(doc(db, coleccion, jugadaId!), updates);
      router.push('/mundial/mis-jugadas');
    } catch (e: any) {
      setError(`Error: ${e.message}`);
    }
    setGuardando(false);
  };

  const setRespuesta = (key: string, valor: string) =>
    setRespuestas(prev => ({ ...prev, [key]: valor }));

  const setPrediccion = (i: number, tipo: 'local' | 'visitante', valor: string) => {
    if (valor !== '' && (isNaN(Number(valor)) || Number(valor) < 0)) return;
    setPredicciones(prev => ({ ...prev, [i]: { ...prev[i], [tipo]: valor } }));
  };

  const formatHora = (dateStr: string) => new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const formatFecha = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const estaIncompleto = (i: number) => {
    const p = predicciones[i];
    return !p || p.local === '' || p.visitante === '';
  };

  const validar = () => {
    for (let i = 0; i < (jugada?.predicciones?.length || 0); i++) {
      if (estaIncompleto(i)) {
        const faltantes = jugada.predicciones.filter((_: any, idx: number) => estaIncompleto(idx)).length;
        setError(`Faltan ${faltantes} partido${faltantes !== 1 ? 's' : ''} sin completar`);
        return false;
      }
    }
    setError(''); return true;
  };

  const YN = ({ varKey }: { varKey: string }) => (
    <div className="flex gap-2">
      <div onClick={() => setRespuesta(varKey, 'si')}
        className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: respuestas[varKey] === 'si' ? 'rgba(200,170,110,0.15)' : 'rgba(200,170,110,0.04)', border: respuestas[varKey] === 'si' ? '1px solid #C8AA6E' : '1px solid rgba(200,170,110,0.15)', color: respuestas[varKey] === 'si' ? '#C8AA6E' : 'rgba(210,185,130,0.55)' }}>
        ✅ SÍ
      </div>
      <div onClick={() => setRespuesta(varKey, 'no')}
        className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{ background: respuestas[varKey] === 'no' ? 'rgba(232,25,44,0.12)' : 'rgba(200,170,110,0.04)', border: respuestas[varKey] === 'no' ? '1px solid #E8192C' : '1px solid rgba(200,170,110,0.15)', color: respuestas[varKey] === 'no' ? '#E8192C' : 'rgba(210,185,130,0.55)' }}>
        ❌ NO
      </div>
    </div>
  );

  const PaisSelect = ({ varKey }: { varKey: string }) => (
    <select
      value={respuestas[varKey] || ''}
      onChange={(e) => setRespuesta(varKey, e.target.value)}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
      style={{ background: respuestas[varKey] ? 'rgba(200,170,110,0.08)' : 'rgba(200,170,110,0.04)', border: respuestas[varKey] ? '1px solid rgba(200,170,110,0.35)' : '1px solid rgba(200,170,110,0.15)', color: respuestas[varKey] ? '#F5F5F0' : 'rgba(210,185,130,0.4)' }}>
      <option value="" disabled>Seleccioná un país</option>
      {PAISES_MUNDIAL.map(p => (
        <option key={p.nombre} value={p.nombre}>{p.flag} {p.nombre}</option>
      ))}
    </select>
  );

  const renderVariable = (v: any) => {
    if (v.tipo === 'numero') return (
      <input type="number" value={respuestas[v.key] || ''} onChange={(e) => setRespuesta(v.key, e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.2)', color: '#F5F5F0' }} />
    );
    if (v.tipo === 'sino') return <YN varKey={v.key} />;
    if (v.tipo === 'pais') return <PaisSelect varKey={v.key} />;
    if (v.tipo === 'texto') return (
      <input type="text" value={respuestas[v.key] || ''} onChange={(e) => setRespuesta(v.key, e.target.value)}
        placeholder="Ej: Mbappe"
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.2)', color: '#F5F5F0' }} />
    );
    return null;
  };

  const prediccionesPorFecha: Record<string, number[]> = {};
  (jugada?.predicciones || []).forEach((p: any, i: number) => {
    const fecha = new Date(p.fecha).toISOString().split('T')[0];
    if (!prediccionesPorFecha[fecha]) prediccionesPorFecha[fecha] = [];
    prediccionesPorFecha[fecha].push(i);
  });

  const maxStep = esComunitaria ? 2 : 3;

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">🏆</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p></div>
    </main>
  );

  if (bloqueado) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center px-4">
      <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
        <div className="text-4xl mb-3">🔒</div>
        <div className="font-condensed text-xl font-black mb-2" style={{ color: '#C8AA6E' }}>Jugadas bloqueadas</div>
        <p className="text-sm mb-4" style={{ color: 'rgba(210,185,130,0.65)' }}>Ya no se pueden editar jugadas.</p>
        <button onClick={() => router.push('/mundial/mis-jugadas')}
          className="px-6 py-2 rounded-xl font-condensed font-black text-sm"
          style={{ background: '#C8AA6E', color: '#0d0d1a' }}>VOLVER</button>
      </div>
    </main>
  );

  if (!jugada) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-sm mb-4" style={{ color: 'rgba(210,185,130,0.65)' }}>Jugada no encontrada</p>
        <button onClick={() => router.push('/mundial/mis-jugadas')}
          className="px-6 py-2 rounded-xl font-condensed font-black text-sm"
          style={{ background: '#C8AA6E', color: '#0d0d1a' }}>VOLVER</button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step === 1 ? router.push('/mundial/mis-jugadas') : setStep(step - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>
            Mis Jugadas · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Editar</b>
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1" style={{ color: '#C8AA6E' }}>✏️ Editar Jugada</h1>
        <p className="text-xs mb-4" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Paso {step} de {maxStep}</p>
        <div className="flex items-center gap-2">
          {Array.from({ length: maxStep }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-black text-sm flex-shrink-0"
                style={{ background: step >= s ? '#C8AA6E' : 'rgba(200,170,110,0.15)', color: step >= s ? '#0d0d1a' : 'rgba(210,185,130,0.5)' }}>
                {step > s ? '✓' : s}
              </div>
              {s < maxStep && <div className="flex-1 h-0.5" style={{ background: step > s ? '#C8AA6E' : 'rgba(200,170,110,0.15)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">

        {!esComunitaria && step === 1 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(210,185,130,0.6)' }}>Nombre de la jugada</div>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
              style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.2)', color: '#F5F5F0' }} />

            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(210,185,130,0.6)' }}>Variables por todo el mundial</div>
            {jugada.variablesMeta?.map((v: any) => (
              <div key={v.key} className="mb-5">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: 'rgba(210,185,130,0.7)', lineHeight: '1.5' }}>{v.label}</label>
                  <span className="text-xs font-black flex-shrink-0"
                    style={{ background: 'rgba(200,170,110,0.1)', border: '1px solid rgba(200,170,110,0.2)', color: '#C8AA6E', padding: '2px 8px', borderRadius: '6px' }}>
                    {v.pts} pts
                  </span>
                </div>
                {renderVariable(v)}
              </div>
            ))}

            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg"
              style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
              SIGUIENTE →
            </button>
          </>
        )}

        {((esComunitaria && step === 1) || (!esComunitaria && step === 2)) && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>
              Predicciones · <span style={{ color: '#C8AA6E' }}>{jugada.predicciones?.length || 0} partidos</span>
            </div>
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.12)' }}>
              <span>ℹ️</span>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)' }}>Modificá solo los partidos que quieras cambiar.</p>
            </div>

            {Object.entries(prediccionesPorFecha).map(([fecha, indices]) => (
              <div key={fecha} className="mb-4">
                <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>
                  {formatFecha(fecha + 'T12:00:00')}
                </div>
                {indices.map((i) => {
                  const p = jugada.predicciones[i];
                  const incompleto = estaIncompleto(i);
                  return (
                    <div key={i} className="rounded-2xl p-4 mb-2"
                      style={{ background: '#0D1B3E', border: incompleto && error ? '1px solid rgba(232,25,44,0.5)' : '1px solid rgba(200,170,110,0.15)', transition: 'border .3s' }}>
                      <div className="text-xs mb-3 text-center" style={{ color: 'rgba(210,185,130,0.6)' }}>{formatHora(p.fecha)}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-right">
                          <div className="text-sm font-bold mb-2" style={{ color: '#F5F5F0' }}>{p.local}</div>
                          <input type="tel" inputMode="numeric" pattern="[0-9]*"
                            value={predicciones[i]?.local || ''}
                            onChange={(e) => setPrediccion(i, 'local', e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-lg font-black text-center outline-none"
                            style={{ background: 'rgba(200,170,110,0.08)', border: '1px solid rgba(200,170,110,0.3)', color: '#C8AA6E' }} />
                        </div>
                        <div className="font-condensed text-xl font-black px-2" style={{ color: 'rgba(210,185,130,0.4)' }}>—</div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-bold mb-2" style={{ color: '#F5F5F0' }}>{p.visitante}</div>
                          <input type="tel" inputMode="numeric" pattern="[0-9]*"
                            value={predicciones[i]?.visitante || ''}
                            onChange={(e) => setPrediccion(i, 'visitante', e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-lg font-black text-center outline-none"
                            style={{ background: 'rgba(200,170,110,0.08)', border: '1px solid rgba(200,170,110,0.3)', color: '#C8AA6E' }} />
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
            <button onClick={() => { if (validar()) setStep(esComunitaria ? 2 : 3); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
              SIGUIENTE →
            </button>
            <button onClick={() => esComunitaria ? router.push('/mundial/mis-jugadas') : setStep(1)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
              ← ATRÁS
            </button>
          </>
        )}

        {((esComunitaria && step === 2) || (!esComunitaria && step === 3)) && (
          <>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(200,170,110,0.07)', border: '1px solid rgba(200,170,110,0.2)' }}>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-condensed text-xl font-black mb-1" style={{ color: '#C8AA6E' }}>
                {esComunitaria ? 'Prode Comunitario' : nombre}
              </div>
              <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Revisá los cambios antes de guardar</div>
            </div>

            {!esComunitaria && jugada.variablesMeta && (
              <>
                <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>Variables</div>
                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                  {jugada.variablesMeta.map((v: any, i: number) => (
                    <div key={v.key} className="flex justify-between items-center px-4 py-3"
                      style={{ borderBottom: i < jugada.variablesMeta.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none' }}>
                      <span className="text-xs flex-1 mr-2" style={{ color: 'rgba(210,185,130,0.7)' }}>{v.label}</span>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: '#F5F5F0' }}>
                        {v.tipo === 'sino' ? (respuestas[v.key] === 'si' ? 'SÍ' : 'NO') : respuestas[v.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.6)' }}>
              Predicciones ({jugada.predicciones?.length} partidos)
            </div>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              {jugada.predicciones?.map((p: any, i: number) => (
                <div key={i} className="flex items-center px-4 py-2"
                  style={{ borderBottom: i < jugada.predicciones.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none' }}>
                  <div className="flex-1 text-xs font-semibold truncate" style={{ color: '#F5F5F0' }}>{p.local}</div>
                  <div className="font-condensed text-base font-black px-3 flex-shrink-0" style={{ color: '#C8AA6E' }}>
                    {predicciones[i]?.local} - {predicciones[i]?.visitante}
                  </div>
                  <div className="flex-1 text-xs font-semibold text-right truncate" style={{ color: '#F5F5F0' }}>{p.visitante}</div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}
            <button onClick={guardarCambios} disabled={guardando}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{ background: '#C8AA6E', color: '#0d0d1a', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'GUARDANDO...' : '✅ GUARDAR CAMBIOS'}
            </button>
            <button onClick={() => setStep(esComunitaria ? 1 : 2)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
              ← ATRÁS
            </button>
          </>
        )}

      </div>
    </main>
  );
}

export default function EditarJugadaMundial() {
  return <Suspense><EditarJugadaMundialForm /></Suspense>;
}