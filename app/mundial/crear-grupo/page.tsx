'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const VARIABLES_DEFAULT = [
  { key: 'amarillas', label: '¿Cuántas amarillas habrá en la fase de grupos?', pts: 12, tipo: 'numero' },
  { key: 'rojas', label: '¿Cuántas rojas habrá en la fase de grupos?', pts: 10, tipo: 'numero' },
  { key: 'goles', label: '¿Cuántos goles habrá en total en la fase de grupos?', pts: 8, tipo: 'numero' },
  { key: 'golesMax', label: '¿Cuántos goles tendrá el partido con más goles?', pts: 10, tipo: 'numero' },
  { key: 'penales', label: '¿Cuántos penales habrá en la fase de grupos?', pts: 10, tipo: 'numero' },
  { key: 'hayGolAntes5', label: '¿Habrá un gol antes del min 5 en algún partido?', pts: 5, tipo: 'sino' },
  { key: 'hayGolAlargue', label: '¿Habrá gol en el alargue del 2do tiempo?', pts: 6, tipo: 'sino' },
  { key: 'hayCeroCero', label: '¿Habrá algún resultado 0-0?', pts: 2, tipo: 'sino' },
  { key: 'varAnulaGol', label: '¿El VAR anulará algún gol?', pts: 5, tipo: 'sino' },
];

export default function CrearGrupoMundial() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [controlPagos, setControlPagos] = useState(false);
  const [chatHabilitado, setChatHabilitado] = useState(false);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const [opcionVariables, setOpcionVariables] = useState<'predeterminadas' | 'custom' | null>(null);
  const [variablesCustom, setVariablesCustom] = useState(VARIABLES_DEFAULT.map(v => ({ ...v })));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const esPlus = userData?.plus === true;

  const handleCrear = () => {
    setError('');
    if (!nombre.trim()) { setError('El nombre del grupo es obligatorio'); return; }
    if (!controlPagos) { setShowAlerta(true); return; }
    crearGrupo();
  };

  const crearGrupo = async () => {
    setShowAlerta(false);
    setCreando(true);
    try {
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
      await addDoc(collection(db, 'grupos_mundial'), {
        nombre: nombre.trim(),
        tipo: 'mundial2026',
        precio: controlPagos && precio ? parseFloat(precio) : null,
        moneda: controlPagos ? moneda : null,
        controlPagos,
        chatHabilitado,
        creadorId: user.uid,
        creadorEmail: user.email,
        codigo,
        miembros: [user.uid],
        variablesCustom: esPlus && opcionVariables === 'custom' ? variablesCustom : null,
        creadoEn: serverTimestamp(),
      });
      router.push('/mundial/grupos');
    } catch (e: any) {
      setError('Error al crear el grupo. Intentá de nuevo.');
    }
    setCreando(false);
  };

  const actualizarVariable = (index: number, campo: 'label' | 'pts', valor: string) => {
    setVariablesCustom(prev => prev.map((v, i) => {
      if (i !== index) return v;
      if (campo === 'pts') return { ...v, pts: parseInt(valor) || 0 };
      return { ...v, label: valor };
    }));
  };

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} className="rounded-full flex-shrink-0 cursor-pointer"
      style={{ width: '41px', height: '22px', background: value ? '#C8AA6E' : 'rgba(200,170,110,0.15)', position: 'relative', transition: 'background .3s' }}>
      <div style={{ position: 'absolute', top: '2px', left: value ? '21px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left .3s', boxShadow: '0 2px 5px rgba(0,0,0,.3)' }} />
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Crear Grupo</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>🏆 Crear Grupo</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Fase de Grupos</p>
      </div>

      <div className="px-4 py-4">

        {/* NOMBRE */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2"
            style={{ color: 'rgba(210,185,130,0.65)' }}>Nombre del grupo *</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Los Pibardos del Mundial"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.2)', color: '#F5F5F0' }} />
        </div>

        {/* INFO */}
        <div className="rounded-xl p-3 mb-4 flex gap-2"
          style={{ background: 'rgba(200,170,110,0.06)', border: '1px solid rgba(200,170,110,0.15)' }}>
          <span>🌍</span>
          <p className="text-xs" style={{ color: 'rgba(210,185,130,0.75)' }}>
            Cada jugada está compuesta por preguntas variables que aplican a la totalidad del mundial y predicciones de resultados de la fase de grupos
          </p>
        </div>

        {/* COSTO DE JUGADAS */}
        <div className="rounded-xl p-4 mb-4"
          style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
          <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: 'rgba(210,185,130,0.6)' }}>Costo de jugadas</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span style={{ color: '#00C853' }}>✅</span>
              <span className="text-sm" style={{ color: '#F5F5F0' }}>1 jugada gratis por jugador</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💳</span>
              <span className="text-sm" style={{ color: '#F5F5F0' }}>Jugadas extra: <b style={{ color: '#C8AA6E' }}>$0.99 c/u</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#C8AA6E' }}>⭐</span>
              <span className="text-sm" style={{ color: '#C8AA6E' }}>Plus: jugadas ilimitadas</span>
              <div className="flex items-center gap-2">
                <span>??</span>
                <span className="text-sm" style={{ color: '#F5F5F0' }}>Jugadas gratis con referidos</span>
              </div>
            </div>
          </div>
        </div>

        {/* VARIABLES */}
        {esPlus ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(210,185,130,0.65)' }}>Variables del grupo</label>
              <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
                style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E' }}>⭐ PLUS</span>
            </div>
            <div className="flex gap-2 mb-3">
              <div onClick={() => setOpcionVariables('predeterminadas')}
                className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-sm font-semibold"
                style={{ background: opcionVariables === 'predeterminadas' ? 'rgba(200,170,110,0.12)' : 'rgba(200,170,110,0.04)', border: opcionVariables === 'predeterminadas' ? '1px solid #C8AA6E' : '1px solid rgba(200,170,110,0.15)', color: opcionVariables === 'predeterminadas' ? '#C8AA6E' : 'rgba(210,185,130,0.55)' }}>
                ✅ Predeterminadas
              </div>
              <div onClick={() => setOpcionVariables('custom')}
                className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-sm font-semibold"
                style={{ background: opcionVariables === 'custom' ? 'rgba(200,170,110,0.12)' : 'rgba(200,170,110,0.04)', border: opcionVariables === 'custom' ? '1px solid #C8AA6E' : '1px solid rgba(200,170,110,0.15)', color: opcionVariables === 'custom' ? '#C8AA6E' : 'rgba(210,185,130,0.55)' }}>
                ✏️ Las defino yo
              </div>
            </div>
            {opcionVariables === 'custom' && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.2)' }}>
                {variablesCustom.map((v, i) => (
                  <div key={i} className="px-4 py-3"
                    style={{ borderBottom: i < variablesCustom.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none' }}>
                    <input type="text" value={v.label} onChange={(e) => actualizarVariable(i, 'label', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2"
                      style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.15)', color: '#F5F5F0' }} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Puntos:</span>
                      <input type="number" value={v.pts} onChange={(e) => actualizarVariable(i, 'pts', e.target.value)}
                        className="w-16 rounded-lg px-2 py-1 text-xs outline-none text-center"
                        style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.25)', color: '#C8AA6E' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
            style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.15)' }}
            onClick={() => router.push('/plus')}>
            <div className="text-2xl">⭐</div>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: '#C8AA6E' }}>Variables personalizadas</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.65)' }}>Activá PickGol Plus para crear tus propias variables</div>
            </div>
            <div className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E' }}>USD 2.79</div>
          </div>
        )}

        {/* CONTROL DE PAGOS */}
        <div className="rounded-xl p-4 mb-4 flex items-center justify-between cursor-pointer"
          style={{ background: 'rgba(200,170,110,0.04)', border: '1px solid rgba(200,170,110,0.15)' }}
          onClick={() => setControlPagos(!controlPagos)}>
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: '#F5F5F0' }}>Control de pagos internos</div>
            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Activá para gestionar quién pagó en tu grupo</div>
          </div>
          <Toggle value={controlPagos} onToggle={() => setControlPagos(!controlPagos)} />
        </div>

        {controlPagos && (
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2"
              style={{ color: 'rgba(210,185,130,0.65)' }}>Precio interno por jugada (opcional)</label>
            <div className="flex gap-2">
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
                className="rounded-xl px-3 py-3 text-sm outline-none"
                style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.2)', color: '#F5F5F0', width: '90px' }}>
                <option>ARS</option><option>USD</option><option>BRL</option><option>MXN</option>
              </select>
              <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 5000"
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.2)', color: '#F5F5F0' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(210,185,130,0.6)' }}>Monto que cada jugador te paga a vos por fuera de la app.</p>
          </div>
        )}

        {/* CHAT */}
        <div className="rounded-xl p-4 mb-5 flex items-center justify-between cursor-pointer"
          style={{ background: 'rgba(200,170,110,0.04)', border: '1px solid rgba(200,170,110,0.15)' }}
          onClick={() => setChatHabilitado(!chatHabilitado)}>
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: '#F5F5F0' }}>Chat del grupo</div>
            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Habilitá el chat para que los jugadores puedan hablar</div>
          </div>
          <Toggle value={chatHabilitado} onToggle={() => setChatHabilitado(!chatHabilitado)} />
        </div>

        {error && <p className="text-xs mb-4" style={{ color: '#E8192C' }}>{error}</p>}

        <button onClick={handleCrear} disabled={creando}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
          style={{ background: '#C8AA6E', color: '#0d0d1a', opacity: creando ? 0.7 : 1 }}>
          {creando ? 'CREANDO...' : 'CREAR GRUPO'}
        </button>

        <button onClick={() => router.push('/mundial')}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
          CANCELAR
        </button>

      </div>

      {/* ALERTA SIN PAGOS */}
      {showAlerta && (
        <div className="fixed inset-0 flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.85)', zIndex: 999 }}
          onClick={() => setShowAlerta(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-condensed text-xl font-black mb-2" style={{ color: '#C8AA6E' }}>Sin control de pagos</div>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)', lineHeight: '1.6' }}>
                Vas a crear el grupo sin control de pagos internos. ¿Querés continuar?
              </p>
            </div>
            <button onClick={crearGrupo}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
              SÍ, CONTINUAR
            </button>
            <button onClick={() => setShowAlerta(false)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
              CONFIGURAR PAGOS
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
