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

export default function MisJugadas() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<Record<string, any>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      setCargando(true);
      try {
        const q = query(collection(db, 'jugadas'), where('userId', '==', u.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setJugadas(data);

        const grupoIds = [...new Set(data.map((j: any) => j.grupoId).filter(Boolean))];
        const gruposData: Record<string, any> = {};
        for (const gid of grupoIds) {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db: fireDb } = await import('../lib/firebase');
          const gsnap = await getDoc(doc(fireDb, 'grupos', gid));
          if (gsnap.exists()) gruposData[gid] = { id: gsnap.id, ...gsnap.data() };
        }
        setGrupos(gruposData);
      } catch (e) {}
      setCargando(false);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatFecha = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
        <h1 className="font-condensed text-3xl font-black mb-1">Mis Jugadas 🎯</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Todas tus jugadas activas</p>
      </div>

      <div className="px-4 py-4">

        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{color:'#8892A4'}}>Cargando jugadas...</p>
          </div>
        )}

        {!cargando && jugadas.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-4xl mb-3">⚽</div>
            <div className="font-condensed text-lg font-bold mb-2">No tenés jugadas todavía</div>
            <div className="text-xs mb-4" style={{color:'#8892A4'}}>Entrá a un grupo y creá tu primera jugada</div>
            <button
              onClick={() => window.location.href = '/grupos'}
              className="w-full py-3 rounded-xl font-condensed font-black text-base"
              style={{background:'#E8192C',color:'white'}}
            >
              IR A MIS GRUPOS
            </button>
          </div>
        )}

        {!cargando && jugadas.map((j) => {
          const grupo = grupos[j.grupoId];
          return (
            <div
              key={j.id}
              className="rounded-2xl mb-3 overflow-hidden"
              style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div>
                  <div className="font-condensed text-base font-black">{j.nombre}</div>
                  <div className="text-xs" style={{color:'#8892A4'}}>
                    {grupo ? `${grupo.nombre} · ${LIGAS_NOMBRES[grupo.liga] || grupo.liga}` : 'Sin grupo'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>0 pts</div>
                  <div className="text-xs" style={{color:'#8892A4'}}>{formatFecha(j.creadoEn)}</div>
                </div>
              </div>

              <div className="px-4 py-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '🟨 Amarillas', value: j.variables?.amarillas },
                    { label: '🟥 Rojas', value: j.variables?.rojas },
                    { label: '⚽ Goles', value: j.variables?.goles },
                    { label: '🎯 Goles máx', value: j.variables?.golesMax },
                    { label: '🎽 Penales', value: j.variables?.penales },
                    { label: '⚡ Gol min 5', value: j.variables?.hayGolAntes5 === 'si' ? 'SÍ' : 'NO' },
                    { label: '⏱️ Gol alargue', value: j.variables?.hayGolAlargue === 'si' ? 'SÍ' : 'NO' },
                    { label: '🥅 0-0', value: j.variables?.hayCeroCero === 'si' ? 'SÍ' : 'NO' },
                    { label: '📺 VAR', value: j.variables?.varAnulaGol === 'si' ? 'SÍ' : 'NO' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-xs" style={{color:'#8892A4'}}>{item.label}</span>
                      <span className="text-xs font-bold">{item.value ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {grupo?.controlPagos && (
                <div className="px-4 py-2" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                  <span
                    className="text-xs px-2 py-1 rounded-lg font-bold"
                    style={{
                      background: j.pagadoInterno ? 'rgba(0,200,83,0.1)' : 'rgba(255,179,0,0.1)',
                      color: j.pagadoInterno ? '#00C853' : '#FFB300'
                    }}
                  >
                    {j.pagadoInterno ? '✅ Pago confirmado' : '⏳ Pago pendiente'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

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
          <span className="text-xs font-semibold" style={{color:'#E8192C'}}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/perfil'}>
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Perfil</span>
        </div>
      </div>

    </main>
  );
}