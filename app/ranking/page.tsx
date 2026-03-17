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

export default function Ranking() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [grupoId, setGrupoId] = useState('');
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      try {
        const q = query(collection(db, 'grupos'), where('miembros', 'array-contains', u.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGrupos(data);
        if (data.length > 0) {
          setGrupoId(data[0].id);
          cargarRanking(data[0].id);
        }
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const cargarRanking = async (gid: string) => {
    setCargando(true);
    try {
      const q = query(collection(db, 'jugadas'), where('grupoId', '==', gid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.puntos || 0) - (a.puntos || 0));
      setJugadas(data);
    } catch (e) {}
    setCargando(false);
  };

  const handleGrupoChange = (gid: string) => {
    setGrupoId(gid);
    cargarRanking(gid);
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  const miPosicion = jugadas.findIndex(j => j.userId === user?.uid) + 1;

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <h1 className="font-condensed text-3xl font-black mb-3">Ranking 🏆</h1>
        {grupos.length > 0 && (
          <select
            value={grupoId}
            onChange={(e) => handleGrupoChange(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.15)'}}
          >
            {grupos.map(g => (
              <option key={g.id} value={g.id}>{g.nombre} — {LIGAS_NOMBRES[g.liga] || g.liga}</option>
            ))}
          </select>
        )}
      </div>

      <div className="px-4 py-4">

        {grupos.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-4xl mb-3">👥</div>
            <div className="font-condensed text-lg font-bold mb-2">No tenés grupos todavía</div>
            <div className="text-xs mb-4" style={{color:'#8892A4'}}>Entrá a un grupo para ver el ranking</div>
            <button
              onClick={() => window.location.href = '/grupos'}
              className="w-full py-3 rounded-xl font-condensed font-black text-base"
              style={{background:'#E8192C',color:'white'}}
            >
              IR A MIS GRUPOS
            </button>
          </div>
        )}

        {grupos.length > 0 && miPosicion > 0 && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-4" style={{background:'linear-gradient(135deg,#0A1F5C,#0D2870)',border:'1px solid rgba(201,168,76,0.2)'}}>
            <div className="font-condensed text-4xl font-black" style={{color:'#C9A84C'}}>#{miPosicion}</div>
            <div>
              <div className="font-condensed text-base font-black">Tu posición</div>
              <div className="text-xs" style={{color:'#8892A4'}}>{jugadas.find(j => j.userId === user?.uid)?.nombre || 'Tu jugada'}</div>
            </div>
            <div className="ml-auto font-condensed text-2xl font-black" style={{color:'#C9A84C'}}>
              {jugadas.find(j => j.userId === user?.uid)?.puntos || 0} pts
            </div>
          </div>
        )}

        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{color:'#8892A4'}}>Cargando ranking...</p>
          </div>
        )}

        {!cargando && jugadas.length === 0 && grupos.length > 0 && (
          <div className="rounded-2xl p-6 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-4xl mb-3">⏳</div>
            <div className="font-condensed text-lg font-bold mb-2">Sin jugadas todavía</div>
            <div className="text-xs" style={{color:'#8892A4'}}>El ranking aparecerá cuando haya jugadas en este grupo</div>
          </div>
        )}

        {!cargando && jugadas.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            {jugadas.map((j, i) => {
              const esMio = j.userId === user?.uid;
              const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div
                  key={j.id}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{
                    borderBottom: i < jugadas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: esMio ? 'rgba(232,25,44,0.07)' : 'transparent'
                  }}
                >
                  <div className="w-8 text-center flex-shrink-0">
                    {medalla ? (
                      <span className="text-xl">{medalla}</span>
                    ) : (
                      <span className="font-condensed text-base font-black" style={{color:'#8892A4'}}>#{i+1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-condensed text-base font-bold flex items-center gap-2">
                      {j.nombre}
                      {esMio && <span className="text-xs px-2 py-0.5 rounded-lg" style={{background:'rgba(232,25,44,0.2)',color:'#E8192C'}}>Vos</span>}
                    </div>
                    <div className="text-xs" style={{color:'#8892A4'}}>{j.userEmail?.split('@')[0]}</div>
                  </div>
                  <div className="font-condensed text-xl font-black" style={{color: i === 0 ? '#C9A84C' : i === 1 ? '#A8A8A8' : i === 2 ? '#CD7F32' : '#F5F5F0'}}>
                    {j.puntos || 0} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Grupos</span>
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