'use client';

import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const LIGAS_NOMBRES: Record<string, string> = {
  premier: 'Premier League',
  laliga: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
  ligue1: 'Ligue 1',
  ligapro: 'Liga Profesional',
  brasileirao: 'Brasileirão',
};

export default function Fixture() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ligaId, setLigaId] = useState('premier');
  const [partidos, setPartidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = '/login';
      else { setUser(u); setLoading(false); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading) cargarPartidos(ligaId);
  }, [ligaId, loading]);

  const cargarPartidos = async (id: string) => {
    setCargando(true);
    setPartidos([]);
    try {
      const res = await fetch(`/api/fixture?liga=${id}`);
      const data = await res.json();
      setPartidos(data.partidos || []);
    } catch (e) {
      setPartidos([]);
    }
    setCargando(false);
  };

  const formatFecha = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatHora = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚽</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  const porFecha: Record<string, any[]> = {};
  partidos.forEach(p => {
    const fecha = formatFecha(p.fecha);
    if (!porFecha[fecha]) porFecha[fecha] = [];
    porFecha[fecha].push(p);
  });

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-4">
        <h1 className="font-condensed text-3xl font-black mb-3">Fixture 📅</h1>
        <select
          value={ligaId}
          onChange={(e) => setLigaId(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
          style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.15)'}}
        >
          {Object.entries(LIGAS_NOMBRES).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
      </div>

      <div className="px-4 py-4">
        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{color:'#8892A4'}}>Cargando partidos...</p>
          </div>
        )}

        {!cargando && partidos.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-sm" style={{color:'#8892A4'}}>No hay partidos disponibles</p>
          </div>
        )}

        {!cargando && Object.entries(porFecha).map(([fecha, ps]) => (
          <div key={fecha} className="mb-4">
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{color:'#8892A4'}}>{fecha}</div>
            <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
              {ps.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3" style={{borderBottom: i < ps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{p.local}</span>
                      {p.estado === 'FT' ? <span className="font-condensed text-lg font-black">{p.golesLocal}</span> : <span className="text-xs" style={{color:'#8892A4'}}>—</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{p.visitante}</span>
                      {p.estado === 'FT' ? <span className="font-condensed text-lg font-black">{p.golesVisitante}</span> : <span className="text-xs" style={{color:'#8892A4'}}>—</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.estado === 'FT' && <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{background:'rgba(255,255,255,0.06)',color:'#8892A4'}}>FIN</span>}
                    {p.estado === 'NS' && <span className="text-xs font-semibold" style={{color:'#C9A84C'}}>{formatHora(p.fecha)}</span>}
                    {p.estado !== 'FT' && p.estado !== 'NS' && <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{background:'rgba(232,25,44,0.15)',color:'#E8192C'}}>● {p.estado}'</span>}
                  </div>
                </div>
              ))}
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
          <span className="text-xs font-semibold" style={{color:'#E8192C'}}>Fixture</span>
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