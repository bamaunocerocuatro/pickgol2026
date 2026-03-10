 'use client';

import { useEffect, useState, Suspense } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

function CrearJugadaForm() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const grupoId = searchParams.get('grupo');

  // Variables por fecha
  const [amarillas, setAmarillas] = useState('');
  const [rojas, setRojas] = useState('');
  const [goles, setGoles] = useState('');
  const [golesMax, setGolesMax] = useState('');
  const [penales, setPenales] = useState('');
  const [hayGolAntes5, setHayGolAntes5] = useState<string>('');
  const [hayGolAlargue, setHayGolAlargue] = useState<string>('');
  const [hayCeroCero, setHayCeroCero] = useState<string>('');
  const [varAnulaGol, setVarAnulaGol] = useState<string>('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      if (grupoId) {
        const snap = await getDoc(doc(db, 'grupos', grupoId));
        if (snap.exists()) setGrupo({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [grupoId]);

  const validarStep1 = () => {
    if (!nombre.trim()) { setError('El nombre de la jugada es obligatorio'); return false; }
    setError('');
    return true;
  };

  const validarStep2 = () => {
    if (!amarillas || !rojas || !goles || !golesMax || !penales || !hayGolAntes5 || !hayGolAlargue || !hayCeroCero || !varAnulaGol) {
      setError('Completá todas las variables antes de continuar');
      return false;
    }
    setError('');
    return true;
  };

  const guardarJugada = async () => {
    setGuardando(true);
    try {
      await addDoc(collection(db, 'jugadas'), {
        nombre: nombre.trim(),
        grupoId,
        userId: user.uid,
        userEmail: user.email,
        variables: {
          amarillas: parseInt(amarillas),
          rojas: parseInt(rojas),
          goles: parseInt(goles),
          golesMax: parseInt(golesMax),
          penales: parseInt(penales),
          hayGolAntes5,
          hayGolAlargue,
          hayCeroCero,
          varAnulaGol,
        },
        pagado: false,
        pagadoInterno: false,
        creadoEn: serverTimestamp(),
      });
      window.location.href = grupoId ? `/grupo/${grupoId}` : '/inicio';
    } catch (e) {
      setError('Error al guardar. Intentá de nuevo.');
    }
    setGuardando(false);
  };

  const YN = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-2">
      <div
        onClick={() => onChange('si')}
        className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{
          background: value === 'si' ? 'rgba(0,200,83,0.15)' : 'rgba(0,0,0,0.35)',
          border: value === 'si' ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.09)',
          color: value === 'si' ? '#00C853' : '#8892A4'
        }}
      >✅ SÍ</div>
      <div
        onClick={() => onChange('no')}
        className="flex-1 rounded-xl py-3 text-center cursor-pointer font-condensed font-bold text-sm"
        style={{
          background: value === 'no' ? 'rgba(232,25,44,0.15)' : 'rgba(0,0,0,0.35)',
          border: value === 'no' ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.09)',
          color: value === 'no' ? '#E8192C' : '#8892A4'
        }}
      >❌ NO</div>
    </div>
  );

  const Input = ({ label, pts, value, onChange, placeholder }: any) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#8892A4'}}>{label}</label>
        <span className="text-xs font-black" style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',color:'#C9A84C',padding:'2px 8px',borderRadius:'6px'}}>{pts} pts</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
        style={{background:'rgba(0,0,0,0.35)',border: value ? '1px solid rgba(0,200,83,0.3)' : '1px solid rgba(255,255,255,0.09)'}}
      />
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚽</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => step === 1 ? window.history.back() : setStep(step - 1)}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm"
          >←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>
            {grupo ? <><b style={{color:'rgba(255,255,255,0.65)'}}>{grupo.nombre}</b></> : 'Nueva jugada'}
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Crear Jugada</h1>
        <p className="text-xs mb-4" style={{color:'#8892A4'}}>Paso {step} de 3</p>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-black text-sm flex-shrink-0"
                style={{
                  background: step > s ? '#00C853' : step === s ? '#E8192C' : 'rgba(255,255,255,0.1)',
                  color: 'white'
                }}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className="flex-1 h-0.5" style={{background: step > s ? '#00C853' : 'rgba(255,255,255,0.1)'}}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">

        {/* STEP 1 — NOMBRE */}
        {step === 1 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#8892A4'}}>Datos de la jugada</div>

            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Nombre de tu jugada *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Mi jugada 1"
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
              />
            </div>

            {grupo && (
              <div className="rounded-xl p-3 mb-4 flex gap-2" style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <span>👥</span>
                <div>
                  <div className="text-sm font-semibold">{grupo.nombre}</div>
                  <div className="text-xs" style={{color:'#8892A4'}}>Tu jugada se registrará en este grupo</div>
                </div>
              </div>
            )}

            <div className="rounded-xl p-3 mb-5 flex gap-2" style={{background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.18)'}}>
              <span>ℹ️</span>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>En el siguiente paso completás todas las variables de la fecha. Una vez enviada no se puede modificar.</p>
            </div>

            {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

            <button
              onClick={() => { if (validarStep1()) setStep(2); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg"
              style={{background:'#E8192C',color:'white'}}
            >
              SIGUIENTE →
            </button>
          </>
        )}

        {/* STEP 2 — VARIABLES */}
        {step === 2 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#8892A4'}}>Variables de la fecha</div>

            <Input label="¿Cuántas amarillas habrá?" pts={12} value={amarillas} onChange={setAmarillas} placeholder="Ej: 8" />
            <Input label="¿Cuántas rojas habrá?" pts={10} value={rojas} onChange={setRojas} placeholder="Ej: 2" />
            <Input label="¿Cuántos goles habrá en la fecha?" pts={8} value={goles} onChange={setGoles} placeholder="Ej: 12" />
            <Input label="¿Cuántos goles tendrá el partido con más goles?" pts={10} value={golesMax} onChange={setGolesMax} placeholder="Ej: 4" />
            <Input label="¿Cuántos penales habrá?" pts={10} value={penales} onChange={setPenales} placeholder="Ej: 2" />

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#8892A4'}}>¿Habrá un gol antes del min 5?</label>
                <span className="text-xs font-black" style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',color:'#C9A84C',padding:'2px 8px',borderRadius:'6px'}}>5 pts</span>
              </div>
              <YN value={hayGolAntes5} onChange={setHayGolAntes5} />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#8892A4'}}>¿Habrá gol en el alargue del 2do tiempo?</label>
                <span className="text-xs font-black" style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',color:'#C9A84C',padding:'2px 8px',borderRadius:'6px'}}>6 pts</span>
              </div>
              <YN value={hayGolAlargue} onChange={setHayGolAlargue} />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#8892A4'}}>¿Habrá algún resultado 0-0?</label>
                <span className="text-xs font-black" style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',color:'#C9A84C',padding:'2px 8px',borderRadius:'6px'}}>2 pts</span>
              </div>
              <YN value={hayCeroCero} onChange={setHayCeroCero} />
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#8892A4'}}>¿El VAR anulará algún gol?</label>
                <span className="text-xs font-black" style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',color:'#C9A84C',padding:'2px 8px',borderRadius:'6px'}}>5 pts</span>
              </div>
              <YN value={varAnulaGol} onChange={setVarAnulaGol} />
            </div>

            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
              <span>⚠️</span>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Todas las respuestas aplican sobre tiempo reglamentario y alargue. No cuenta definición por penales.</p>
            </div>

            {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

            <button
              onClick={() => { if (validarStep2()) setStep(3); }}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{background:'#E8192C',color:'white'}}
            >
              SIGUIENTE →
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
            >
              ← ATRÁS
            </button>
          </>
        )}

        {/* STEP 3 — CONFIRMACION */}
        {step === 3 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-4" style={{color:'#8892A4'}}>Confirmación</div>

            <div className="rounded-2xl p-4 mb-4 text-center" style={{background:'rgba(0,200,83,0.07)',border:'1px solid rgba(0,200,83,0.2)'}}>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-condensed text-xl font-black mb-1">{nombre}</div>
              <div className="text-xs" style={{color:'#8892A4'}}>{grupo?.nombre || 'Sin grupo'}</div>
            </div>

            <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
              {[
                { label: '🟨 Amarillas', value: amarillas },
                { label: '🟥 Rojas', value: rojas },
                { label: '⚽ Goles totales', value: goles },
                { label: '🎯 Goles partido máximo', value: golesMax },
                { label: '🎽 Penales', value: penales },
                { label: '⚡ Gol antes del min 5', value: hayGolAntes5 === 'si' ? 'SÍ' : 'NO' },
                { label: '⏱️ Gol en alargue', value: hayGolAlargue === 'si' ? 'SÍ' : 'NO' },
                { label: '🥅 Resultado 0-0', value: hayCeroCero === 'si' ? 'SÍ' : 'NO' },
                { label: '📺 VAR anula gol', value: varAnulaGol === 'si' ? 'SÍ' : 'NO' },
              ].map((item, i, arr) => (
                <div key={i} className="flex justify-between items-center px-4 py-3" style={{borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                  <span className="text-xs" style={{color:'#8892A4'}}>{item.label}</span>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3 mb-5 flex gap-2" style={{background:'rgba(232,25,44,0.07)',border:'1px solid rgba(232,25,44,0.18)'}}>
              <span>⚠️</span>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>Una vez confirmada la jugada <b style={{color:'white'}}>no se puede modificar</b>. Revisá bien antes de enviar.</p>
            </div>

            {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

            <button
              onClick={guardarJugada}
              disabled={guardando}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
              style={{background:'#E8192C',color:'white',opacity: guardando ? 0.7 : 1}}
            >
              {guardando ? 'GUARDANDO...' : '✅ CONFIRMAR JUGADA'}
            </button>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
            >
              ← ATRÁS
            </button>
          </>
        )}

      </div>
    </main>
  );
}

export default function CrearJugada() {
  return (
    <Suspense>
      <CrearJugadaForm />
    </Suspense>
  );
}
