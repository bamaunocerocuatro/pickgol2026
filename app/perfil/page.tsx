'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Perfil() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      setNombre(u.displayName || '');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const guardarPerfil = async () => {
    setGuardando(true);
    try {
      await updateProfile(user, { displayName: nombre.trim() });
      setMensaje('Perfil actualizado ✅');
      setEditando(false);
      setTimeout(() => setMensaje(''), 3000);
    } catch (e) {
      setMensaje('Error al guardar. Intentá de nuevo.');
    }
    setGuardando(false);
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">👤</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  const inicial = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-8">
        <h1 className="font-condensed text-3xl font-black mb-6">Mi Perfil 👤</h1>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-condensed text-2xl font-black flex-shrink-0"
            style={{background:'#E8192C',color:'white'}}
          >
            {inicial}
          </div>
          <div>
            <div className="font-condensed text-xl font-black">{user?.displayName || 'Sin nombre'}</div>
            <div className="text-xs" style={{color:'#8892A4'}}>{user?.email}</div>
            <div className="text-xs mt-1" style={{color:'rgba(255,255,255,0.3)'}}>
              {user?.providerData?.[0]?.providerId === 'google.com' ? '🔵 Google' : '📧 Email'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">

        {/* EDITAR NOMBRE */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Nombre de usuario</div>
              {!editando && (
                <button
                  onClick={() => setEditando(true)}
                  className="text-xs px-3 py-1 rounded-lg font-bold"
                  style={{background:'rgba(232,25,44,0.15)',color:'#E8192C'}}
                >
                  Editar
                </button>
              )}
            </div>
            {editando ? (
              <>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none mb-3"
                  style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}
                />
                <div className="flex gap-2">
                  <button
                    onClick={guardarPerfil}
                    disabled={guardando}
                    className="flex-1 py-2 rounded-xl font-condensed font-black text-sm"
                    style={{background:'#E8192C',color:'white',opacity: guardando ? 0.7 : 1}}
                  >
                    {guardando ? 'GUARDANDO...' : 'GUARDAR'}
                  </button>
                  <button
                    onClick={() => { setEditando(false); setNombre(user?.displayName || ''); }}
                    className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm"
                    style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
                  >
                    CANCELAR
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm" style={{color:'#8892A4'}}>{user?.displayName || 'Sin nombre configurado'}</div>
            )}
            {mensaje && <p className="text-xs mt-2" style={{color:'#00C853'}}>{mensaje}</p>}
          </div>
        </div>

        {/* INFO CUENTA */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="px-4 py-4">
            <div className="text-sm font-semibold mb-3">Información de cuenta</div>
            <div className="flex justify-between items-center py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span className="text-xs" style={{color:'#8892A4'}}>Email</span>
              <span className="text-xs font-semibold">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span className="text-xs" style={{color:'#8892A4'}}>Método de acceso</span>
              <span className="text-xs font-semibold">{user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs" style={{color:'#8892A4'}}>UID</span>
              <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.3)'}}>{user?.uid?.substring(0, 12)}...</span>
            </div>
          </div>
        </div>

        {/* CERRAR SESION */}
        <button
          onClick={cerrarSesion}
          className="w-full py-3 rounded-xl font-condensed font-black text-base"
          style={{background:'transparent',border:'1px solid rgba(232,25,44,0.3)',color:'#E8192C'}}
        >
          🚪 CERRAR SESIÓN
        </button>

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/inicio'}>
          <span className="text-lg">🏠</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/fixture'}>
          <span className="text-lg">📅</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/grupos'}>
          <span className="text-lg">👥</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-lg">🏆</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Ranking</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{color:'#E8192C'}}>Perfil</span>
        </div>
      </div>

    </main>
  );
}