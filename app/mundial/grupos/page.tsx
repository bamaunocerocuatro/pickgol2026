'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function GruposMundial() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setCargando(true);
      try {
        const q = query(
          collection(db, 'grupos_mundial'),
          where('miembros', 'array-contains', u.uid)
        );
        const snap = await getDocs(q);
        setGrupos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {}
      setCargando(false);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Mis Grupos</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>🏅 MIS GRUPOS</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Fase de Grupos</p>
      </div>

      <div className="px-4 py-4">

        {/* BOTONES RÁPIDOS */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => router.push('/mundial/crear-grupo')}
            className="flex-1 py-3 rounded-xl font-condensed font-black text-sm"
            style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
            + CREAR GRUPO
          </button>
          <button
            onClick={() => router.push('/unirse?mundial=1')}
            className="flex-1 py-3 rounded-xl font-condensed font-bold text-sm"
            style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
            🔗 UNIRME
          </button>
        </div>

        {/* LISTA */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: 'rgba(210,185,130,0.6)' }}>
          Mis grupos del Mundial
        </div>

        {cargando && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando grupos...</p>
          </div>
        )}

        {!cargando && grupos.length === 0 && (
          <div className="rounded-2xl mb-4 overflow-hidden"
            style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="px-4 py-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="font-condensed text-base font-bold mb-1" style={{ color: '#F5F5F0' }}>No tenés grupos del Mundial</div>
              <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Creá uno o unite con un código</div>
            </div>
          </div>
        )}

        {!cargando && grupos.map((g) => (
          <div
            key={g.id}
            onClick={() => router.push(`/mundial/grupo/${g.id}`)}
            className="rounded-2xl p-4 mb-3 cursor-pointer"
            style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>{g.nombre}</div>
              {g.creadorId === user?.uid && (
                <span className="text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E' }}>👑 Creador</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>👥 {g.miembros?.length || 1} jugadores</span>
              <span className="text-xs" style={{ color: 'rgba(210,185,130,0.4)' }}>·</span>
              <span className="text-xs font-black" style={{ color: '#C8AA6E' }}>{g.codigo}</span>
              {g.chatHabilitado && <span className="text-xs" style={{ color: '#00C853' }}>· 💬</span>}
            </div>
          </div>
        ))}

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏠</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Mundial</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/grupos')}>
          <span className="text-lg">👥</span>
          <span className="text-xs font-semibold" style={{ color: '#C8AA6E' }}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/mis-jugadas')}>
          <span className="text-lg">🎯</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Perfil</span>
        </div>
      </div>

    </main>
  );
}
