 'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const NIVELES = [
  { referidos: 3, jugadas: 1, label: '3 referidos → 1 jugada gratis' },
  { referidos: 6, jugadas: 2, label: '6 referidos → 2 jugadas gratis' },
  { referidos: 10, jugadas: 5, label: '10 referidos → 5 jugadas gratis' },
];

export default function Referidos() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const codigoRef = userData?.codigoRef || user?.uid?.substring(0, 8).toUpperCase();
  const link = `https://pickgol2026.vercel.app?ref=${codigoRef}`;
  const totalReferidos = userData?.totalReferidos || 0;
  const jugadasGratis = userData?.jugadasGratis || 0;

  const compartir = async () => {
    const texto = `¡Jugá el Prode Mundial 2026 conmigo en PickGol! Predecí los resultados y ganá jugadas gratis. Registrate acá: ${link}`;
    if (navigator.share) {
      await navigator.share({ title: 'PickGol 2026', text: texto, url: link });
    } else {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const nivelActual = NIVELES.filter(n => totalReferidos >= n.referidos).length;
  const proximoNivel = NIVELES[nivelActual];
  const progreso = proximoNivel
    ? Math.min((totalReferidos / proximoNivel.referidos) * 100, 100)
    : 100;

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">🎁</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => window.location.href = '/inicio'}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Invitar amigos</span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">🎁 Referidos</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>Invitá amigos y ganá jugadas gratis para el Mundial</p>

        <div className="flex gap-2 mt-4">
          <div className="flex-1 text-center rounded-xl py-3" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-2xl font-black" style={{color:'#C9A84C'}}>{totalReferidos}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Referidos</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-3" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-2xl font-black" style={{color:'#00C853'}}>{jugadasGratis}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Jugadas gratis</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">

        {/* PROGRESO */}
        {proximoNivel && (
          <div className="rounded-2xl p-4 mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold" style={{color:'#8892A4'}}>Próximo nivel</span>
              <span className="text-xs font-bold" style={{color:'#C9A84C'}}>{totalReferidos}/{proximoNivel.referidos} referidos</span>
            </div>
            <div className="rounded-full overflow-hidden mb-2" style={{background:'rgba(255,255,255,0.07)',height:'8px'}}>
              <div className="h-full rounded-full" style={{background:'linear-gradient(90deg,#E8192C,#C9A84C)',width:`${progreso}%`,transition:'width .5s'}} />
            </div>
            <div className="text-xs" style={{color:'#8892A4'}}>
              Faltán <b style={{color:'white'}}>{proximoNivel.referidos - totalReferidos}</b> referidos para ganar <b style={{color:'#00C853'}}>{proximoNivel.jugadas} jugada{proximoNivel.jugadas > 1 ? 's' : ''} gratis</b>
            </div>
          </div>
        )}

        {/* NIVELES */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>Recompensas</div>
        <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          {NIVELES.map((nivel, i) => {
            const alcanzado = totalReferidos >= nivel.referidos;
            return (
              <div key={i} className="flex items-center px-4 py-4"
                style={{borderBottom: i < NIVELES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{background: alcanzado ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.05)'}}>
                  <span className="text-lg">{alcanzado ? '✅' : '🎁'}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{nivel.referidos} referidos</div>
                  <div className="text-xs" style={{color: alcanzado ? '#00C853' : '#8892A4'}}>
                    {nivel.jugadas} jugada{nivel.jugadas > 1 ? 's' : ''} gratis para el Mundial
                  </div>
                </div>
                {alcanzado && <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:'rgba(0,200,83,0.1)',color:'#00C853'}}>¡Ganado!</span>}
              </div>
            );
          })}
        </div>

        {/* LINK */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>Tu link de invitación</div>
        <div className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}}>
          <div className="flex-1 text-xs font-mono truncate" style={{color:'#8892A4'}}>{link}</div>
          <button onClick={() => { navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
            className="text-xs px-3 py-1 rounded-lg font-bold flex-shrink-0"
            style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>
            {copiado ? '✅' : 'Copiar'}
          </button>
        </div>

        {/* BOTON COMPARTIR */}
        <button onClick={compartir}
          className="w-full py-4 rounded-xl font-condensed font-black text-lg"
          style={{background:'linear-gradient(135deg,#E8192C,#8B0018)',color:'white'}}>
          🚀 INVITAR AMIGOS
        </button>

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/inicio'}>
          <span className="text-lg">🏠</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/fixture'}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/grupos'}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/mis-jugadas'}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/perfil'}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Perfil</span>
        </div>
      </div>

    </main>
  );
}
