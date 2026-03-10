'use client';

import { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useParams } from 'next/navigation';

const LIGAS: Record<string, { nombre: string; pais: string; }> = {
  premier: { nombre: 'Premier League', pais: 'Inglaterra' },
  laliga: { nombre: 'La Liga', pais: 'España' },
  seriea: { nombre: 'Serie A', pais: 'Italia' },
  bundesliga: { nombre: 'Bundesliga', pais: 'Alemania' },
  ligue1: { nombre: 'Ligue 1', pais: 'Francia' },
  ligapro: { nombre: 'Liga Profesional', pais: 'Argentina' },
  brasileirao: { nombre: 'Brasileirão', pais: 'Brasil' },
};

export default function Liga() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const id = params.id as string;
  const liga = LIGAS[id];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = '/login';
      else { setUser(u); setLoading(false); }
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
        <h1 className="font-condensed text-3xl font-black mb-1">{liga.nombre}</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>{liga.pais} · Temporada 2024/25</p>
      </div>

      <div className="px-4 py-4">

        {/* MIS GRUPOS EN ESTA LIGA */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Mis grupos en {liga.nombre}
        </div>

        <div className="rounded-2xl mb-4 overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="px-4 py-5 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="font-condensed text-base font-bold mb-1">No tenés grupos en esta liga</div>
            <div className="text-xs mb-4" style={{color:'#8892A4'}}>Creá uno o unite con un código</div>
            <button
              onClick={() => window.location.href = `/crear-grupo?liga=${id}`}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{background:'#E8192C',color:'white'}}
            >
              + CREAR GRUPO
            </button>
            <button
              onClick={() => window.location.href = '/unirse'}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}
            >
              🔗 UNIRME A UN GRUPO
            </button>
          </div>
        </div>

        {/* PRODE COMUNITARIO */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Prode Comunitario
        </div>

        <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🌍</div>
              <div>
                <div className="font-condensed text-base font-black">PRODE COMUNITARIO</div>
                <div className="text-xs" style={{color:'#8892A4'}}>{liga.nombre} · Todos contra todos</div>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2" style={{background:'#E8192C',color:'white'}}>
              💰 JUGADA PAGA — USD 0.99
            </button>
            <button className="w-full py-3 rounded-xl font-condensed font-bold text-sm" style={{background:'transparent',border:'1px solid rgba(0,200,83,0.3)',color:'#00C853'}}>
              🎮 JUGADA GRATIS
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/inicio'}>
          <span className="text-lg">🏠</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-lg">📅</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-lg">👥</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-lg">🏆</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Ranking</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-lg">💬</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Chat</span>
        </div>
      </div>

    </main>
  );
}