'use client';

import { useEffect, useState, Suspense } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

const LIGAS = [
  { id: 'premier', nombre: 'Premier League' },
  { id: 'laliga', nombre: 'La Liga' },
  { id: 'seriea', nombre: 'Serie A' },
  { id: 'bundesliga', nombre: 'Bundesliga' },
  { id: 'ligue1', nombre: 'Ligue 1' },
  { id: 'ligapro', nombre: 'Liga Profesional' },
  { id: 'brasileirao', nombre: 'Brasileirão' },
];

function CrearGrupoForm() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [ligaId, setLigaId] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [tipo, setTipo] = useState<'temporada' | 'fechas'>('temporada');
  const [controlPagos, setControlPagos] = useState(false);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ligaParam = searchParams.get('liga');
    if (ligaParam) setLigaId(ligaParam);
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = '/login';
      else { setUser(u); setLoading(false); }
    });
    return () => unsub();
  }, []);

  const handleCrear = () => {
    setError('');
    if (!nombre.trim()) { setError('El nombre del grupo es obligatorio'); return; }
    if (!ligaId) { setError('Elegí una liga'); return; }
    if (!controlPagos) {
      setShowAlerta(true);
      return;
    }
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
        tipo,
        controlPagos,
        creadorId: user.uid,
        creadorEmail: user.email,
        codigo,
        miembros: [user.uid],
        creadoEn: serverTimestamp(),
      });
      window.location.href = '/inicio';
    } catch (e: any) {
      setError('Error al crear el grupo. Intentá de nuevo.');
    }
    setCreando(false);
  };

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
            onClick={() => window.history.back()}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm"
          >←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>Crear Grupo</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Crear Grupo</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Gratis · Lanzamiento PickGol 2026</p>
      </div>

      <div className="px-4 py-4">

        {/* NOMBRE */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Nombre del grupo *</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Los Pibardos"
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
          />
        </div>

        {/* LIGA */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Liga *</label>
          <select
            value={ligaId}
            onChange={(e) => setLigaId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
          >
            <option value="">— Elegí una liga —</option>
            {LIGAS.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            <option value="mundial" disabled>🏆 Mundial 2026 — disponible el 9 Jun</option>
          </select>
        </div>

        {/* TIPO */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Duración del torneo *</label>
          <div className="flex gap-2">
            <div
              onClick={() => setTipo('temporada')}
              className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-sm font-semibold"
              style={{
                background: tipo === 'temporada' ? 'rgba(232,25,44,0.15)' : 'rgba(0,0,0,0.35)',
                border: tipo === 'temporada' ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.09)',
                color: tipo === 'temporada' ? '#F5F5F0' : '#8892A4'
              }}
            >
              📅 Toda la temporada
            </div>
            <div
              onClick={() => setTipo('fechas')}
              className="flex-1 rounded-xl px-3 py-3 text-center cursor-pointer text-sm font-semibold"
              style={{
                background: tipo === 'fechas' ? 'rgba(232,25,44,0.15)' : 'rgba(0,0,0,0.35)',
                border: tipo === 'fechas' ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.09)',
                color: tipo === 'fechas' ? '#F5F5F0' : '#8892A4'
              }}
            >
              🎯 Fechas específicas
            </div>
          </div>
        </div>

        {/* CONTROL DE PAGOS */}
        <div
          className="rounded-xl p-4 mb-4 flex items-center justify-between cursor-pointer"
          style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
          onClick={() => setControlPagos(!controlPagos)}
        >
          <div>
            <div className="text-sm font-semibold mb-1">Control de pagos internos</div>
            <div className="text-xs" style={{color:'#8892A4'}}>Activá para gestionar quién pagó en tu grupo</div>
          </div>
          <div
            className="rounded-full flex-shrink-0 ml-3"
            style={{
              width:'41px',height:'22px',
              background: controlPagos ? '#00C853' : 'rgba(255,255,255,0.1)',
              position:'relative',transition:'background .3s'
            }}
          >
            <div style={{
              position:'absolute',top:'2px',
              left: controlPagos ? '21px' : '2px',
              width:'18px',height:'18px',
              background:'white',borderRadius:'50%',
              transition:'left .3s',
              boxShadow:'0 2px 5px rgba(0,0,0,.3)'
            }}/>
          </div>
        </div>

        {/* PRECIO INTERNO — solo si tiene control de pagos */}
        {controlPagos && (
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Precio interno por jugada (opcional)</label>
            <div className="flex gap-2">
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="rounded-xl px-3 py-3 text-white text-sm outline-none"
                style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)',width:'90px'}}
              >
                <option>ARS</option>
                <option>USD</option>
                <option>BRL</option>
                <option>MXN</option>
              </select>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 5000"
                className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
              />
            </div>
            <p className="text-xs mt-2" style={{color:'#8892A4'}}>Monto que cada jugador te paga a vos por fuera de la app. PickGol no lo gestiona.</p>
          </div>
        )}

        {/* ALERTA */}
        <div className="rounded-xl p-3 mb-5 flex gap-2" style={{background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.18)'}}>
          <span>ℹ️</span>
          <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>Crear el grupo es <b style={{color:'white'}}>gratis</b>. Aprovechá el lanzamiento de PickGol 2026 — ningún jugador paga a PickGol al crear sus jugadas.</p>
        </div>

        {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

        <button
          onClick={handleCrear}
          disabled={creando}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
          style={{background:'#E8192C',color:'white',opacity: creando ? 0.7 : 1}}
        >
          {creando ? 'CREANDO...' : 'CREAR GRUPO'}
        </button>

        <button
          onClick={() => window.history.back()}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
        >
          CANCELAR
        </button>

      </div>

      {/* MODAL ALERTA SIN CONTROL DE PAGOS */}
      {showAlerta && (
        <div
          className="fixed inset-0 flex items-center justify-center px-5"
          style={{background:'rgba(0,0,0,0.75)',zIndex:999}}
          onClick={() => setShowAlerta(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{background:'#0D1B3E'}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-condensed text-xl font-black mb-2">Sin control de pagos</div>
              <p className="text-xs" style={{color:'#8892A4',lineHeight:'1.6'}}>
                Va a crear el grupo sin control de pagos internos. Los jugadores no tendrán seguimiento de pagos. ¿Desea continuar?
              </p>
            </div>
            <button
              onClick={crearGrupo}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{background:'#E8192C',color:'white'}}
            >
              SÍ, CONTINUAR SIN CONTROL
            </button>
            <button
              onClick={() => setShowAlerta(false)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
            >
              CONFIGURAR PAGOS
            </button>
          </div>
        </div>
      )}

    </main>
  );
}

export default function CrearGrupo() {
  return (
    <Suspense>
      <CrearGrupoForm />
    </Suspense>
  );
}