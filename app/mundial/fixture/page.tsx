'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function FixtureMundial() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else { setUser(u); setLoading(false); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading) cargarPartidos();
  }, [loading]);

  const cargarPartidos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/mundial/fixture');
      const data = await res.json();
      setPartidos(data.partidos || []);
    } catch (e) { setPartidos([]); }
    setCargando(false);
  };

  const formatFecha = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  };

  const formatHora = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  const porFecha: Record<string, any[]> = {};
  const ordenados = [...partidos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  ordenados.forEach(p => {
    const clave = new Date(p.fecha).toISOString().split('T')[0];
    if (!porFecha[clave]) porFecha[clave] = [];
    porFecha[clave].push(p);
  });
  const fechas = Object.keys(porFecha).sort();

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Fixture</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>FIXTURE 📅</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Fase de Grupos · 11 jun — 2 jul 2026</p>
      </div>

      <div className="px-4 py-4">
        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando partidos...</p>
          </div>
        )}
        {!cargando && partidos.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="text-4xl mb-3">📅</div>
            <div className="font-condensed text-xl font-black mb-2" style={{ color: '#C8AA6E' }}>PRÓXIMAMENTE</div>
            <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>El fixture estará disponible cuando la API lo publique</p>
          </div>
        )}
        {!cargando && fechas.map((fecha) => {
          const ps = porFecha[fecha];
          const todosFT = ps.every(p => p.estado === 'FT' || p.estado === 'AET' || p.estado === 'PEN');
          const hayEnVivo = ps.some(p => ['1H','HT','2H','ET','P'].includes(p.estado));
          return (
            <div key={fecha} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-condensed text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(210,185,130,0.6)' }}>
                  {formatFecha(fecha + 'T12:00:00')}
                </span>
                {hayEnVivo && <span className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse" style={{ background: 'rgba(232,25,44,0.15)', color: '#E8192C' }}>● EN VIVO</span>}
                {todosFT && !hayEnVivo && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(200,170,110,0.08)', color: 'rgba(210,185,130,0.55)' }}>Finalizada</span>}
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                {ps.map((p, i) => (
                  <div key={i} className="px-4 py-3" style={{ borderBottom: i < ps.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none' }}>
                    {(i === 0 || ps[i-1]?.ronda !== p.ronda) && (
                      <div className="text-xs font-bold mb-2" style={{ color: 'rgba(200,170,110,0.55)' }}>{p.ronda}</div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {p.localLogo && <img src={p.localLogo} alt={p.local} className="w-5 h-5 object-contain" />}
                            <span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>{p.local}</span>
                          </div>
                          {p.estado === 'FT' || p.estado === 'AET' || p.estado === 'PEN'
                            ? <span className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>{p.golesLocal ?? 0}</span>
                            : <span className="text-xs" style={{ color: 'rgba(210,185,130,0.45)' }}>—</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {p.visitanteLogo && <img src={p.visitanteLogo} alt={p.visitante} className="w-5 h-5 object-contain" />}
                            <span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>{p.visitante}</span>
                          </div>
                          {p.estado === 'FT' || p.estado === 'AET' || p.estado === 'PEN'
                            ? <span className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>{p.golesVisitante ?? 0}</span>
                            : <span className="text-xs" style={{ color: 'rgba(210,185,130,0.45)' }}>—</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-[60px]">
                        {(p.estado === 'FT' || p.estado === 'AET' || p.estado === 'PEN') && <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(200,170,110,0.08)', color: 'rgba(210,185,130,0.55)' }}>FIN</span>}
                        {p.estado === 'NS' && (
                          <div>
                            <div className="text-sm font-black" style={{ color: '#C8AA6E' }}>{formatHora(p.fecha)}</div>
                            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.55)' }}>ARG</div>
                          </div>
                        )}
                        {['1H','HT','2H','ET','BT','P'].includes(p.estado) && <span className="text-xs px-2 py-1 rounded-lg font-bold animate-pulse" style={{ background: 'rgba(232,25,44,0.15)', color: '#E8192C' }}>● {p.estado}</span>}
                      </div>
                    </div>
                    {p.ciudad && <div className="text-xs mt-1" style={{ color: 'rgba(200,170,110,0.35)' }}>📍 {p.ciudad}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏆</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Mundial</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: '#C8AA6E' }}>Fixture</span>
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
