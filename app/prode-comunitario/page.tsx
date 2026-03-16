 'use client';

import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const LIGAS = [
  { id: 'bundesliga', nombre: 'Bundesliga', pais: 'Alemania', bandera: '/flags/ger.png' },
  { id: 'ligapro', nombre: 'Liga Profesional', pais: 'Argentina', bandera: '/flags/arg.png' },
  { id: 'primera-b', nombre: 'Primera B Nacional', pais: 'Argentina', bandera: '/flags/arg.png' },
  { id: 'brasileirao', nombre: 'Brasileirão', pais: 'Brasil', bandera: '/flags/bra.png' },
  { id: 'laliga', nombre: 'La Liga', pais: 'España', bandera: '/flags/esp.png' },
  { id: 'ligue1', nombre: 'Ligue 1', pais: 'Francia', bandera: '/flags/fra.png' },
  { id: 'premier', nombre: 'Premier League', pais: 'Inglaterra', bandera: '/flags/eng.png' },
  { id: 'seriea', nombre: 'Serie A', pais: 'Italia', bandera: '/flags/ita.png' },
];

export default function ProdeComunitario() {
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
        <div className="text-5xl mb-3">🌍</div>
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
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>Prode Comunitario</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Prode Comunitario 🌍</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Todos contra todos · Elegí una liga</p>
      </div>

      <div className="px-4 py-4">

        {/* MUNDIAL */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Mundial
        </div>
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{background:'rgba(232,25,44,0.08)',border:'1px solid rgba(232,25,44,0.2)'}}>
          <div className="text-3xl">🏆</div>
          <div className="flex-1">
            <div className="font-condensed text-base font-black">MUNDIAL 2026</div>
            <div className="text-xs" style={{color:'#8892A4'}}>Disponible el 1 Abr 2026</div>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{background:'rgba(232,25,44,0.15)',color:'#E8192C'}}>Próximo</span>
        </div>

        {/* LIGAS */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          Ligas disponibles
        </div>

        <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          {LIGAS.map((liga, i) => (
            <div
              key={liga.id}
              className="flex items-center px-4 py-3 cursor-pointer active:bg-white/5"
              style={{borderBottom: i < LIGAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}
              onClick={() => window.location.href = `/liga/${liga.id}`}
            >
              <div className="w-8 h-6 rounded overflow-hidden mr-3 flex-shrink-0">
                <img
                  src={liga.bandera}
                  alt={liga.pais}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
              </div>
              <div className="flex-1">
                <div className="font-condensed text-base font-bold">{liga.nombre}</div>
                <div className="text-xs" style={{color:'#8892A4'}}>{liga.pais}</div>
              </div>
              <div className="text-white/30">›</div>
            </div>
          ))}
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
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/ranking'}>
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
