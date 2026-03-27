'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import LigaSelector from '../components/LigaSelector';

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

function CrearGrupoForm() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [ligaId, setLigaId] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [controlPagos, setControlPagos] = useState(false);
  const [chatHabilitado, setChatHabilitado] = useState(false);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const [opcionVariables, setOpcionVariables] = useState<'predeterminadas' | 'custom' | null>(null);
  const [variablesCustom, setVariablesCustom] = useState(VARIABLES_DEFAULT.map(v => ({ ...v })));
  const searchParams = useSearchParams();

  useEffect(() => {
    const ligaParam = searchParams.get('liga');
    if (ligaParam) setLigaId(ligaParam);
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
    if (!ligaId) { setError('Elegí una liga'); return; }
    if (!controlPagos) { setShowAlerta(true); return; }
    crearGrupo();
  };

  const crearGrupo = async () => {
    setShowAlerta(false);
    setCreando(true);
    try {
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
      await addDoc(collection(db, 'grupos'), {
        nombre: nombre.trim(),
        liga: ligaId,
        precio: controlPagos && precio ? parseFloat(precio) : null,
        moneda: controlPagos ? moneda : null,
        tipo: 'temporada',
        controlPagos,
        chatHabilitado,
        creadorId: user.uid,
        creadorEmail: user.email,
        codigo,
        miembros: [user.uid],
        variablesCustom: esPlus && opcionVariables === 'custom' ? variablesCustom : null,
        creadoEn: serverTimestamp(),
      });
      router.push('/grupos');
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

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">⚽</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>Crear Grupo</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Crear Grupo</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Gratis · Lanzamiento PickGol 2026</p>
      </div>

      <div className="px-4 py-4">

        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Nombre del grupo *</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Los Pibardos"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}} />
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Liga *</label>
          <LigaSelector value={ligaId} onChange={setLigaId} />
        </div>

        <div className="rounded-xl p-3 mb-4 flex gap-2" style={{background:'rgba(0,200,83,0.07)',border:'1px solid rgba(0,200,83,0.2)'}}>
          <span>📅</span>
          <p className="text-xs" style={{color:'rgba(255,255,255,0.6)'}}>Los grupos de PickGol son por <b style={{color:'white'}}>toda la temporada</b>. Cada jugador crea una jugada por fecha y los puntos se acumulan a lo largo del torneo.</p>
        </div>

        {esPlus ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'#8892A4'}}>Variables del grupo</label>
              <span className="text-xs px-2 py-0.5 rounded-lg font-bold" style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>⭐ PLUS</span>
            </div>
            <div className="flex gap-2 mb-3">
              <div onClick={() => setOpcionVariables('predeterminadas')} className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-sm font-semibold"
                style={{ background: opcionVariables === 'predeterminadas' ? 'rgba(0,200,83,0.15)' : 'rgba(0,0,0,0.35)', border: opcionVariables === 'predeterminadas' ? '1px solid #00C853' : '1px solid rgba(255,255,255,0.09)', color: opcionVariables === 'predeterminadas' ? '#00C853' : '#8892A4' }}>
                ✅ Predeterminadas
              </div>
              <div onClick={() => setOpcionVariables('custom')} className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-sm font-semibold"
                style={{ background: opcionVariables === 'custom' ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.35)', border: opcionVariables === 'custom' ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.09)', color: opcionVariables === 'custom' ? '#C9A84C' : '#8892A4' }}>
                ✏️ Las defino yo
              </div>
            </div>
            {opcionVariables === 'custom' && (
              <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(201,168,76,0.2)'}}>
                {variablesCustom.map((v, i) => (
                  <div key={i} className="px-4 py-3" style={{borderBottom: i < variablesCustom.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                    <input type="text" value={v.label} onChange={(e) => actualizarVariable(i, 'label', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-white text-xs outline-none mb-2"
                      style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.07)'}} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{color:'#8892A4'}}>Puntos:</span>
                      <input type="number" value={v.pts} onChange={(e) => actualizarVariable(i, 'pts', e.target.value)}
                        className="w-16 rounded-lg px-2 py-1 text-white text-xs outline-none text-center"
                        style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(201,168,76,0.3)',color:'#C9A84C'}} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {opcionVariables === 'predeterminadas' && (
              <p className="text-xs mt-2" style={{color:'#8892A4'}}>Se usarán las variables estándar de PickGol con sus puntos originales.</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
            style={{background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.2)'}}
            onClick={() => router.push('/plus')}>
            <div className="text-2xl">⭐</div>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{color:'#C9A84C'}}>Variables personalizadas</div>
              <div className="text-xs" style={{color:'#8892A4'}}>Activá PickGol Plus para crear tus propias variables</div>
            </div>
            <div className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>USD 2.79</div>
          </div>
        )}

        <div className="rounded-xl p-4 mb-4 flex items-center justify-between cursor-pointer"
          style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
          onClick={() => setControlPagos(!controlPagos)}>
          <div>
            <div className="text-sm font-semibold mb-1">Control de pagos internos</div>
            <div className="text-xs" style={{color:'#8892A4'}}>Activá para gestionar quién pagó en tu grupo</div>
          </div>
          <div className="rounded-full flex-shrink-0 ml-3"
            style={{width:'41px',height:'22px',background: controlPagos ? '#00C853' : 'rgba(255,255,255,0.1)',position:'relative',transition:'background .3s'}}>
            <div style={{position:'absolute',top:'2px',left: controlPagos ? '21px' : '2px',width:'18px',height:'18px',background:'white',borderRadius:'50%',transition:'left .3s',boxShadow:'0 2px 5px rgba(0,0,0,.3)'}}/>
          </div>
        </div>

        {controlPagos && (
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Precio interno por jugada (opcional)</label>
            <div className="flex gap-2">
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)}
                className="rounded-xl px-3 py-3 text-white text-sm outline-none"
                style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)',width:'90px'}}>
                <option>ARS</option><option>USD</option><option>BRL</option><option>MXN</option>
              </select>
              <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 5000"
                className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}} />
            </div>
            <p className="text-xs mt-2" style={{color:'#8892A4'}}>Monto que cada jugador te paga a vos por fuera de la app. PickGol no lo gestiona.</p>
          </div>
        )}

        <div className="rounded-xl p-4 mb-4 flex items-center justify-between cursor-pointer"
          style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
          onClick={() => setChatHabilitado(!chatHabilitado)}>
          <div>
            <div className="text-sm font-semibold mb-1">Chat del grupo</div>
            <div className="text-xs" style={{color:'#8892A4'}}>Habilitá el chat para que los jugadores puedan hablar</div>
          </div>
          <div className="rounded-full flex-shrink-0 ml-3"
            style={{width:'41px',height:'22px',background: chatHabilitado ? '#00C853' : 'rgba(255,255,255,0.1)',position:'relative',transition:'background .3s'}}>
            <div style={{position:'absolute',top:'2px',left: chatHabilitado ? '21px' : '2px',width:'18px',height:'18px',background:'white',borderRadius:'50%',transition:'left .3s',boxShadow:'0 2px 5px rgba(0,0,0,.3)'}}/>
          </div>
        </div>

        <div className="rounded-xl p-3 mb-5 flex gap-2" style={{background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.18)'}}>
          <span>ℹ️</span>
          <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>Crear el grupo es <b style={{color:'white'}}>gratis</b>. Aprovechá el lanzamiento de PickGol 2026 — ningún jugador paga a PickGol al crear sus jugadas.</p>
        </div>

        {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

        <button onClick={handleCrear} disabled={creando}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
          style={{background:'#E8192C',color:'white',opacity: creando ? 0.7 : 1}}>
          {creando ? 'CREANDO...' : 'CREAR GRUPO'}
        </button>

        <button onClick={() => router.back()}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}>
          CANCELAR
        </button>

      </div>

      {showAlerta && (
        <div className="fixed inset-0 flex items-center justify-center px-5"
          style={{background:'rgba(0,0,0,0.75)',zIndex:999}}
          onClick={() => setShowAlerta(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{background:'#0D1B3E'}}
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-condensed text-xl font-black mb-2">Sin control de pagos</div>
              <p className="text-xs" style={{color:'#8892A4',lineHeight:'1.6'}}>
                Va a crear el grupo sin control de pagos internos. Los jugadores no tendrán seguimiento de pagos. ¿Desea continuar?
              </p>
            </div>
            <button onClick={crearGrupo}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{background:'#E8192C',color:'white'}}>
              SÍ, CONTINUAR SIN CONTROL
            </button>
            <button onClick={() => setShowAlerta(false)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}>
              CONFIGURAR PAGOS
            </button>
          </div>
        </div>
      )}

    </main>
  );
}

export default function CrearGrupo() {
  return <Suspense><CrearGrupoForm /></Suspense>;
}
