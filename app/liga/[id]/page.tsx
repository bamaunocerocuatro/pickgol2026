'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';

const LIGAS: Record<string, { nombre: string; pais: string; bandera: string }> = {
  premier: { nombre: 'Premier League', pais: 'Inglaterra', bandera: '/flags/eng.png' },
  laliga: { nombre: 'La Liga', pais: 'España', bandera: '/flags/esp.png' },
  seriea: { nombre: 'Serie A', pais: 'Italia', bandera: '/flags/ita.png' },
  bundesliga: { nombre: 'Bundesliga', pais: 'Alemania', bandera: '/flags/ger.png' },
  ligue1: { nombre: 'Ligue 1', pais: 'Francia', bandera: '/flags/fra.png' },
  ligapro: { nombre: 'Liga Profesional', pais: 'Argentina', bandera: '/flags/arg.png' },
  brasileirao: { nombre: 'Brasileirão', pais: 'Brasil', bandera: '/flags/bra.png' },
};

export default function Liga() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const params = useParams();
  const id = params.id as string;
  const liga = LIGAS[id];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      setCargando(true);
      try {
        const q = query(
          collection(db, 'grupos'),
          where('miembros', 'array-contains', u.uid),
          where('liga', '==', id)
        );
        const snap = await getDocs(q);
        setGrupos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {}
      setCargando(false);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚽</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  if (!liga) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <p className="text-[#8892A4]">Liga no encontrada</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => window.location.href = '/inicio'}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm"
          >←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Inicio · <b style={{color:'rgba(255,255,255,0.65)'}}>{liga.nombre}</b></span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <img src={liga.bandera} alt={liga.pais} className="w-8 h-6 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          <h1 className="font-condensed text-3xl font-black">{liga.nombre}</h1>
        </div>
        <p className="text-xs" style={{color:'#8892A4'}}>{liga.pais} · Temporada 2025/26</p>
      </div>

      <div className="px-4 py-4">

        {/* BOTONES RAPIDOS */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => window.location.href = `/crear-grupo?liga=${id}`}
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

        {/* MIS GRUPOS EN ESTA LIGA */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Mis grupos en {liga.nombre}
        </div>

        {cargando && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm" style={{color:'#8892A4'}}>Cargando grupos...</p>
          </div>
        )}

        {!cargando && grupos.length === 0 && (
          <div className="rounded-2xl mb-4 overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="px-4 py-5 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="font-condensed text-base font-bold mb-1">No tenés grupos en esta liga</div>
              <div className="text-xs" style={{color:'#8892A4'}}>Creá uno o unite con un código</div>
            </div>
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
              <span className="text-xs" style={{color:'#8892A4'}}>👥 {g.miembros?.length || 1} jugadores</span>
              <span className="text-xs" style={{color:'#8892A4'}}>·</span>
              <span className="text-xs font-black" style={{color:'#C9A84C'}}>{g.codigo}</span>
              {g.chatHabilitado && <span className="text-xs" style={{color:'#00C853'}}>· 💬</span>}
            </div>
          </div>
        ))}

        {/* PRODE COMUNITARIO */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3 mt-2" style={{color:'#8892A4'}}>
          Prode Comunitario
        </div>

        <div
          onClick={() => window.location.href = `/prode-comunitario?liga=${id}`}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
          style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}
        >
          <div className="text-3xl">🌍</div>
          <div className="flex-1">
            <div className="font-condensed text-base font-black">PRODE COMUNITARIO</div>
            <div className="text-xs" style={{color:'#8892A4'}}>{liga.nombre} · Todos contra todos · Gratis</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* FIXTURE RAPIDO */}
        <div
          onClick={() => window.location.href = `/fixture?liga=${id}`}
          className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
          style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}
        >
          <div className="text-3xl">📅</div>
          <div className="flex-1">
            <div className="font-condensed text-base font-black">VER FIXTURE</div>
            <div className="text-xs" style={{color:'#8892A4'}}>Próximos partidos de {liga.nombre}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

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