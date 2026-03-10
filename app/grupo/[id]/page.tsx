 'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';

const LIGAS: Record<string, string> = {
  premier: 'Premier League',
  laliga: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
  ligue1: 'Ligue 1',
  ligapro: 'Liga Profesional',
  brasileirao: 'Brasileirão',
};

export default function GrupoDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [tab, setTab] = useState<'ranking' |'pagos' | 'info'>('ranking');
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'grupos', id));
        if (snap.exists()) {
          setGrupo({ id: snap.id, ...snap.data() });
        }
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const esCreador = grupo?.creadorId === user?.uid;

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚽</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  if (!grupo) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <p className="text-[#8892A4]">Grupo no encontrado</p>
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
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>{grupo.nombre}</b></span>
          {esCreador && (
            <span className="ml-auto text-xs px-2 py-1 rounded-lg font-bold" style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>👑 Creador</span>
          )}
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">{grupo.nombre}</h1>
        <p className="text-xs mb-3" style={{color:'#8892A4'}}>{LIGAS[grupo.liga] || grupo.liga} · {grupo.tipo === 'temporada' ? 'Toda la temporada' : 'Fechas específicas'}</p>

        {/* STATS */}
        <div className="flex gap-2">
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black">{grupo.miembros?.length || 1}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Jugadores</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>0</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Mis pts</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black">#—</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Posición</div>
          </div>
        </div>
      </div>

      {/* CODIGO DE INVITACION */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl p-4 mb-4 text-center" style={{background:'linear-gradient(135deg,#0A1F5C,#0D2870)',border:'1px solid rgba(255,255,255,0.1)'}}>
          <div className="text-xs mb-1" style={{color:'rgba(255,255,255,0.4)'}}>Código de invitación</div>
          <div className="font-condensed text-4xl font-black tracking-widest mb-2" style={{color:'#C9A84C'}}>{grupo.codigo}</div>
          <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>Compartí este código para que otros se unan</div>
        </div>

        {/* BOTON CREAR JUGADA */}
        <button
          onClick={() => window.location.href = `/jugada/crear?grupo=${id}`}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-4"
          style={{background:'#E8192C',color:'white'}}
        >
          ⚽ CREAR MI JUGADA
        </button>

        {/* TABS */}
        <div className="flex mb-4" style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'3px'}}>
          {(['ranking','pagos','info'] as const).map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 text-center py-2 rounded-xl cursor-pointer font-condensed font-bold text-sm capitalize"
              style={{
                background: tab === t ? '#0D1B3E' : 'transparent',
                color: tab === t ? '#F5F5F0' : '#8892A4'
              }}
            >
              {t === 'ranking' ? '🏆 Ranking' : t === 'pagos' ? '💰 Pagos' : 'ℹ️ Info'}
            </div>
          ))}
        </div>

        {/* TAB RANKING */}
        {tab === 'ranking' && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="px-4 py-5 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <div className="font-condensed text-base font-bold mb-1">El ranking aparecerá cuando haya jugadas</div>
              <div className="text-xs" style={{color:'#8892A4'}}>Creá tu jugada para aparecer en el ranking</div>
            </div>
          </div>
        )}

        {/* TAB PAGOS */}
        {tab === 'pagos' && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            {grupo.controlPagos ? (
              <div className="px-4 py-5 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-condensed text-base font-bold mb-1">Control de pagos activo</div>
                <div className="text-xs mb-3" style={{color:'#8892A4'}}>
                  {grupo.precio ? `Monto: ${grupo.moneda} ${grupo.precio} por jugada` : 'Sin monto definido'}
                </div>
                {esCreador && (
                  <div className="text-xs px-3 py-2 rounded-xl" style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',color:'#C9A84C'}}>
                    👑 Como creador podés marcar los pagos de cada jugador cuando haya jugadas creadas
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <div className="text-3xl mb-2">🔓</div>
                <div className="font-condensed text-base font-bold mb-1">Sin control de pagos</div>
                <div className="text-xs" style={{color:'#8892A4'}}>El creador no configuró control de pagos internos</div>
              </div>
            )}
          </div>
        )}

        {/* TAB INFO */}
        {tab === 'info' && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="px-4 py-4">
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>Liga</span>
                <span className="text-sm font-semibold">{LIGAS[grupo.liga] || grupo.liga}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>Duración</span>
                <span className="text-sm font-semibold">{grupo.tipo === 'temporada' ? 'Toda la temporada' : 'Fechas específicas'}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>Jugadores</span>
                <span className="text-sm font-semibold">{grupo.miembros?.length || 1}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>Control de pagos</span>
                <span className="text-sm font-semibold" style={{color: grupo.controlPagos ? '#00C853' : '#8892A4'}}>{grupo.controlPagos ? '✅ Activo' : '❌ No'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs" style={{color:'#8892A4'}}>Código</span>
                <span className="font-condensed text-lg font-black" style={{color:'#C9A84C'}}>{grupo.codigo}</span>
              </div>
            </div>
          </div>
        )}

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
