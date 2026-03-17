'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const LIGAS_NOMBRES: Record<string, string> = {
  premier: 'Premier League',
  laliga: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
  ligue1: 'Ligue 1',
  ligapro: 'Liga Profesional',
  brasileirao: 'Brasileirão',
};

export default function Grupos() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      setCargando(true);
      try {
        const q = query(collection(db, 'grupos'), where('miembros', 'array-contains', u.uid));
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
        <div className="text-5xl mb-3">⚽</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <h1 className="font-condensed text-3xl font-black mb-1">Mis Grupos 👥</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Todos tus grupos activos</p>
      </div>

      <div className="px-4 py-4">

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => window.location.href = '/crear-grupo'}
            className="flex-1 py-3 rounded-xl font-condensed font-black text-sm"
            style={{background:'#E8192C',color:'white'}}
          >
            + CREAR GRUPO
          </button>
          <button
            onClick={() => window.location.href = '/unirse'}
            className="flex-1 py-3 rounded-xl font-condensed font-bold text-sm"
            style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
          >
            🔗 UNIRME
          </button>
        </div>

        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{color:'#8892A4'}}>Cargando grupos...</p>
          </div>
        )}

        {!cargando && grupos.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-4xl mb-3">👥</div>
            <div className="font-condensed text-lg font-bold mb-2">No tenés grupos todavía</div>
            <div className="text-xs mb-4" style={{color:'#8892A4'}}>Creá un grupo o unite con un código</div>
          </div>
        )}

        {!cargando && grupos.map((g) => (
          <div
            key={g.id}
            onClick={() => window.location.href = `/grupo/${g.id}`}
            className="rounded-2xl p-4 mb-3 cursor-pointer"
            style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-condensed text-lg font-black">{g.nombre}</div>
              {g.creadorId === user?.uid && (
                <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>👑 Creador</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{color:'#8892A4'}}>{LIGAS_NOMBRES[g.liga] || g.liga}</span>
              <span className="text-xs" style={{color:'#8892A4'}}>·</span>
              <span className="text-xs" style={{color:'#8892A4'}}>👥 {g.miembros?.length || 1} jugadores</span>
              <span className="text-xs" style={{color:'#8892A4'}}>·</span>
              <span className="text-xs font-black" style={{color:'#C9A84C'}}>{g.codigo}</span>
            </div>
          </div>
        ))}

      </div>

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
          <span className="text-xs font-semibold" style={{color:'#E8192C'}}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/mis-jugadas'}>
          <span className="text-lg">🎯</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/perfil'}>
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Perfil</span>
        </div>
      </div>

    </main>
  );
}