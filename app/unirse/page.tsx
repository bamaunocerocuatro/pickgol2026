 'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';

export default function Unirse() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [grupo, setGrupo] = useState<any>(null);
  const [uniendose, setUniendose] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = '/login';
      else { setUser(u); setLoading(false); }
    });
    return () => unsub();
  }, []);

  const buscarGrupo = async () => {
    setError('');
    setGrupo(null);
    if (!codigo.trim()) { setError('Ingresá un código de grupo'); return; }
    setBuscando(true);
    try {
      const q = query(collection(db, 'grupos'), where('codigo', '==', codigo.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Código incorrecto. Verificá e intentá de nuevo.');
      } else {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setGrupo(data);
        if ((data as any).precio) setShowAlerta(true);
      }
    } catch (e) {
      setError('Error al buscar el grupo. Intentá de nuevo.');
    }
    setBuscando(false);
  };

  const unirse = async () => {
    setShowAlerta(false);
    setUniendose(true);
    try {
      await updateDoc(doc(db, 'grupos', grupo.id), {
        miembros: arrayUnion(user.uid)
      });
      window.location.href = `/grupo/${grupo.id}`;
    } catch (e) {
      setError('Error al unirse al grupo. Intentá de nuevo.');
    }
    setUniendose(false);
  };

  const LIGAS: Record<string, string> = {
    premier: 'Premier League',
    laliga: 'La Liga',
    seriea: 'Serie A',
    bundesliga: 'Bundesliga',
    ligue1: 'Ligue 1',
    ligapro: 'Liga Profesional',
    brasileirao: 'Brasileirão',
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
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>Unirse a un grupo</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Unirse a un grupo</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Ingresá el código que te compartió el creador</p>
      </div>

      <div className="px-4 py-4">

        {/* INPUT CODIGO */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>Código del grupo</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej: AB12CD"
            maxLength={6}
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none text-center font-condensed font-black text-2xl tracking-widest"
            style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
          />
        </div>

        {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

        <button
          onClick={buscarGrupo}
          disabled={buscando}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-4"
          style={{background:'#E8192C',color:'white',opacity: buscando ? 0.7 : 1}}
        >
          {buscando ? 'BUSCANDO...' : 'BUSCAR GRUPO'}
        </button>

        {/* RESULTADO */}
        {grupo && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(0,200,83,0.25)'}}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl">👥</div>
                <div>
                  <div className="font-condensed text-lg font-black">{grupo.nombre}</div>
                  <div className="text-xs" style={{color:'#8892A4'}}>{LIGAS[grupo.liga] || grupo.liga} · {grupo.tipo === 'temporada' ? 'Toda la temporada' : 'Fechas específicas'}</div>
                </div>
              </div>
              {grupo.precio && (
                <div className="rounded-xl p-3 mb-3 flex gap-2" style={{background:'rgba(255,179,0,0.07)',border:'1px solid rgba(255,179,0,0.2)'}}>
                  <span>💰</span>
                  <p className="text-xs" style={{color:'rgba(255,255,255,0.6)'}}>Este grupo tiene un costo interno de <b style={{color:'white'}}>{grupo.moneda} {grupo.precio}</b> por jugada, a pagar por fuera de la app al creador del grupo.</p>
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xs" style={{color:'#8892A4'}}>👥 {grupo.miembros?.length || 1} miembro{grupo.miembros?.length !== 1 ? 's' : ''}</div>
              </div>
              <button
                onClick={() => grupo.precio ? setShowAlerta(true) : unirse()}
                disabled={uniendose}
                className="w-full py-3 rounded-xl font-condensed font-black text-base"
                style={{background:'#00C853',color:'white',opacity: uniendose ? 0.7 : 1}}
              >
                {uniendose ? 'UNIÉNDOSE...' : '✅ UNIRME A ESTE GRUPO'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL ALERTA CON PRECIO */}
      {showAlerta && grupo && (
        <div
          className="fixed inset-0 flex items-center justify-center px-5"
          style={{background:'rgba(0,0,0,0.75)',zIndex:999}}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{background:'#0D1B3E'}}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">💰</div>
              <div className="font-condensed text-xl font-black mb-2">Grupo con costo</div>
              <p className="text-xs" style={{color:'#8892A4',lineHeight:'1.6'}}>
                Este grupo tiene un costo interno de <b style={{color:'white'}}>{grupo.moneda} {grupo.precio}</b> por jugada, a pagar por fuera de la app al creador del grupo. ¿Deseas unirte?
              </p>
            </div>
            <button
              onClick={unirse}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{background:'#E8192C',color:'white'}}
            >
              SÍ, UNIRME AL GRUPO
            </button>
            <button
              onClick={() => setShowAlerta(false)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
