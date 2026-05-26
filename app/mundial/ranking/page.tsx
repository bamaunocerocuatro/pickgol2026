'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function RankingMundial() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [tab, setTab] = useState<'grupos' | 'comunitario'>('grupos');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) cargarRanking(tab);
  }, [user, tab]);

  const cargarRanking = async (tipo: 'grupos' | 'comunitario') => {
    setCargando(true);
    try {
      const coleccion = tipo === 'grupos' ? 'jugadas_mundial' : 'jugadas_comunitarias_mundial';
      const q = query(collection(db, coleccion), where('tipo', '==', 'mundial2026'));
      const snap = await getDocs(q);
      const jugadas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const porUsuario: Record<string, any> = {};
      for (const j of jugadas) {
        const uid = j.userId;
        if (!porUsuario[uid] || (j.puntos || 0) > (porUsuario[uid].puntos || 0)) porUsuario[uid] = j;
      }
      const rankingData = await Promise.all(
        Object.entries(porUsuario).map(async ([userId, jugada]: [string, any]) => {
          let nombre = jugada.userEmail?.split('@')[0] || 'Jugador';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', userId));
            if (usnap.exists()) {
              const d = usnap.data();
              nombre = d.displayName || d.email?.split('@')[0] || nombre;
            }
          } catch (e) {}
          return {
            userId,
            nombre,
            puntos: jugada.puntos || 0,
            esYo: userId === user?.uid,
          };
        })
      );
      rankingData.sort((a, b) => b.puntos - a.puntos);
      setRanking(rankingData);
    } catch (e) {}
    setCargando(false);
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  const miPosicion = ranking.findIndex(r => r.esYo) + 1;
  const misPuntos = ranking.find(r => r.esYo)?.puntos || 0;

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Ranking Global</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>🏆 RANKING GLOBAL</h1>
        <p className="text-xs mt-1 mb-4" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Fase de Grupos</p>
        {miPosicion > 0 && (
          <div className="flex gap-2">
            <div className="flex-1 text-center rounded-xl py-2" style={{ background: 'rgba(200,170,110,0.08)' }}>
              <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{misPuntos}</div>
              <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mis pts</div>
            </div>
            <div className="flex-1 text-center rounded-xl py-2" style={{ background: 'rgba(200,170,110,0.08)' }}>
              <div className="font-condensed text-xl font-black" style={{ color: '#F5F5F0' }}>#{miPosicion}</div>
              <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Posición</div>
            </div>
            <div className="flex-1 text-center rounded-xl py-2" style={{ background: 'rgba(200,170,110,0.08)' }}>
              <div className="font-condensed text-xl font-black" style={{ color: '#F5F5F0' }}>{ranking.length}</div>
              <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Jugadores</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <div className="flex mb-4" style={{ background: 'rgba(200,170,110,0.05)', borderRadius: '12px', padding: '3px', border: '1px solid rgba(200,170,110,0.1)' }}>
          <div onClick={() => setTab('grupos')}
            className="flex-1 text-center py-2 rounded-xl cursor-pointer font-condensed font-bold text-sm"
            style={{ background: tab === 'grupos' ? '#0D1B3E' : 'transparent', color: tab === 'grupos' ? '#C8AA6E' : 'rgba(210,185,130,0.5)' }}>
            👥 Grupos privados
          </div>
          <div onClick={() => setTab('comunitario')}
            className="flex-1 text-center py-2 rounded-xl cursor-pointer font-condensed font-bold text-sm"
            style={{ background: tab === 'comunitario' ? '#0D1B3E' : 'transparent', color: tab === 'comunitario' ? '#C8AA6E' : 'rgba(210,185,130,0.5)' }}>
            🌍 Comunitario
          </div>
        </div>

        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando ranking...</p>
          </div>
        )}

        {!cargando && ranking.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-condensed text-lg font-bold mb-2" style={{ color: '#F5F5F0' }}>Sin jugadas todavía</div>
            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>El ranking se irá armando cuando los jugadores creen sus jugadas</div>
          </div>
        )}

        {!cargando && ranking.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            {ranking.map((r, i) => {
              const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div key={r.userId} className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: i < ranking.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none', background: r.esYo ? 'rgba(200,170,110,0.05)' : 'transparent' }}>
                  <div className="w-8 text-center flex-shrink-0">
                    {medalla
                      ? <span className="text-xl">{medalla}</span>
                      : <span className="font-condensed text-base font-black" style={{ color: 'rgba(210,185,130,0.45)' }}>#{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="font-condensed text-base font-bold flex items-center gap-2" style={{ color: r.esYo ? '#C8AA6E' : '#F5F5F0' }}>
                      {r.nombre}
                      {r.esYo && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E' }}>Vos</span>}
                    </div>
                  </div>
                  <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{r.puntos} pts</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏆</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Mundial</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/grupos')}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/mis-jugadas')}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Perfil</span>
        </div>
      </div>

    </main>
  );
}