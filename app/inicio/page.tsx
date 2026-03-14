'use client';

import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const LIGAS = [
  { id: 'premier', nombre: 'Premier League', bandera: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pais: 'Inglaterra' },
  { id: 'laliga', nombre: 'La Liga', bandera: '🇪🇸', pais: 'España' },
  { id: 'seriea', nombre: 'Serie A', bandera: '🇮🇹', pais: 'Italia' },
  { id: 'bundesliga', nombre: 'Bundesliga', bandera: '🇩🇪', pais: 'Alemania' },
  { id: 'ligue1', nombre: 'Ligue 1', bandera: '🇫🇷', pais: 'Francia' },
  { id: 'ligapro', nombre: 'Liga Profesional', bandera: '🇦🇷', pais: 'Argentina' },
  { id: 'brasileirao', nombre: 'Brasileirão', bandera: '🇧🇷', pais: 'Brasil' },
];

export default function Inicio() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-condensed text-xl font-black text-[#C9A84C]">PickGol 2026</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">🔔</div>
            <div
              onClick={() => window.location.href = '/perfil'}
              className="w-8 h-8 rounded-full flex items-center justify-center font-condensed text-xs font-bold cursor-pointer"
              style={{background:'linear-gradient(135deg,#8B0018,#E8192C)'}}
            >
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
          </div>
        </div>
        <p className="text-[#8892A4] text-xs mb-1">Bienvenido de nuevo,</p>
        <h1 className="font-condensed text-2xl font-black mb-1">{user.displayName || user.email} ⚽</h1>
        <p className="text-xs mb-3" style={{color:'rgba(201,168,76,0.7)'}}>🥇 Tu mejor jugada · <span style={{color:'rgba(255,255,255,0.4)'}}>Próximamente</span></p>
        <div className="flex gap-2">
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>0</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Mis pts</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black">—</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Posición</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black" style={{color:'#00C853'}}>0</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Aciertos</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">

        {/* BANNER MUNDIAL */}
        <div className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer" style={{background:'linear-gradient(135deg,#E8192C,#8B0018)'}}>
          <div className="text-3xl">🏆</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">PRODE MUNDIAL 2026</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>Lanzamiento: 9 Jun 2026 · El más completo</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* LIGAS */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Ligas disponibles
        </div>

        <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          {LIGAS.map((liga, i) => (
            <div
              key={liga.id}
              className="flex items-center px-4 py-3 cursor-pointer active:bg-white/5"
              style={{borderBottom: i < LIGAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}
              onClick={() => window.location.href = `/liga/${liga.id}`}
            >
              <div className="text-2xl mr-3">{liga.bandera}</div>
              <div className="flex-1">
                <div className="font-condensed text-base font-bold">{liga.nombre}</div>
                <div className="text-xs" style={{color:'#8892A4'}}>{liga.bandera} {liga.pais}</div>
              </div>
              <div className="text-white/30">›</div>
            </div>
          ))}
        </div>

        {/* MIS GRUPOS */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Mis Grupos
        </div>

        <div className="rounded-2xl mb-3 overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="px-4 py-5 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="font-condensed text-base font-bold mb-1">Todavía no tenés grupos</div>
            <div className="text-xs mb-4" style={{color:'#8892A4'}}>Creá uno o unite con un código</div>
            <button
              onClick={() => window.location.href = '/crear-grupo'}
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

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/inicio'}>
          <span className="text-lg">🏠</span>
          <span className="text-xs font-semibold" style={{color:'#E8192C'}}>Inicio</span>
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
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/perfil'}>
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Perfil</span>
        </div>
      </div>

    </main>
  );
}