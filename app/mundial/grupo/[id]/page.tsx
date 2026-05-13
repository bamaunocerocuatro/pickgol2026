'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';

export default function GrupoMundialDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [tab, setTab] = useState<'ranking' | 'pagos' | 'info'>('ranking');
  const [guardando, setGuardando] = useState(false);
  const [ranking, setRanking] = useState<any[]>([]);
  const [cargandoRanking, setCargandoRanking] = useState(false);
  const [jugadasPagos, setJugadasPagos] = useState<any[]>([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [showCompartir, setShowCompartir] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'grupos_mundial', id));
        if (snap.exists()) {
          const grupoData = { id: snap.id, ...snap.data() } as any;
          setGrupo(grupoData);
          cargarRanking(id, u.uid);
          if (grupoData.controlPagos && grupoData.creadorId === u.uid) cargarJugadasPagos(id);
        }
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const cargarRanking = async (grupoId: string, uid: string) => {
    setCargandoRanking(true);
    try {
      const q = query(collection(db, 'jugadas_mundial'), where('grupoId', '==', grupoId));
      const snap = await getDocs(q);
      if (snap.empty) { setCargandoRanking(false); return; }
      const jugadas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const porUsuario: Record<string, any> = {};
      for (const j of jugadas) {
        if (!porUsuario[j.userId] || (j.puntos || 0) > (porUsuario[j.userId].puntos || 0)) porUsuario[j.userId] = j;
      }
      const rankingData = await Promise.all(
        Object.entries(porUsuario).map(async ([userId, jugada]) => {
          let nombre = jugada.userEmail || 'Jugador';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', userId));
            if (usnap.exists()) { const d = usnap.data(); nombre = d.displayName || d.email || nombre; }
          } catch (e) {}
          return { userId, nombre, puntos: jugada.puntos || 0, esYo: userId === uid };
        })
      );
      rankingData.sort((a, b) => b.puntos - a.puntos);
      setRanking(rankingData);
    } catch (e) {}
    setCargandoRanking(false);
  };

  const cargarJugadasPagos = async (grupoId: string) => {
    setCargandoPagos(true);
    try {
      const q = query(collection(db, 'jugadas_mundial'), where('grupoId', '==', grupoId));
      const snap = await getDocs(q);
      const jugadas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const jugadasConNombre = await Promise.all(
        jugadas.map(async (j) => {
          let nombre = j.userEmail || 'Jugador';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', j.userId));
            if (usnap.exists()) { const d = usnap.data(); nombre = d.displayName || d.email || nombre; }
          } catch (e) {}
          return { ...j, nombreUsuario: nombre };
        })
      );
      setJugadasPagos(jugadasConNombre);
    } catch (e) {}
    setCargandoPagos(false);
  };

  const togglePago = async (jugadaId: string, estadoActual: boolean) => {
    try {
      await updateDoc(doc(db, 'jugadas_mundial', jugadaId), { pagadoInterno: !estadoActual });
      setJugadasPagos(prev => prev.map(j => j.id === jugadaId ? { ...j, pagadoInterno: !estadoActual } : j));
    } catch (e) {}
  };

  const eliminarGrupo = async () => {
    setEliminando(true);
    try {
      const res = await fetch('/api/mundial/eliminar-grupo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId: id, userId: user.uid }),
      });
      const data = await res.json();
      if (data.ok) router.push('/mundial/grupos');
      else setEliminando(false);
    } catch (e) { setEliminando(false); }
  };

  const toggleChat = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'grupos_mundial', id), { chatHabilitado: !grupo.chatHabilitado });
      setGrupo({ ...grupo, chatHabilitado: !grupo.chatHabilitado });
    } catch (e) {}
    setGuardando(false);
  };

  const toggleControlPagos = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'grupos_mundial', id), { controlPagos: !grupo.controlPagos });
      setGrupo({ ...grupo, controlPagos: !grupo.controlPagos });
      if (!grupo.controlPagos) cargarJugadasPagos(id);
    } catch (e) {}
    setGuardando(false);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(grupo?.codigo || '');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const linkGrupo = `https://pickgol.com/unirse?codigo=${grupo?.codigo}&mundial=1`;

  const compartirWhatsApp = () => {
    const texto = `¡Unite a mi grupo del Mundial 2026 en PickGol! 🏆⚽\nGrupo: *${grupo?.nombre}*\nCódigo: *${grupo?.codigo}*\nEntrá acá: ${linkGrupo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const compartirNativo = async () => {
    const texto = `¡Unite a mi grupo del Mundial 2026 en PickGol! 🏆⚽\nGrupo: ${grupo?.nombre}\nCódigo: ${grupo?.codigo}\nEntrá acá: ${linkGrupo}`;
    if (navigator.share) {
      await navigator.share({ title: `Grupo ${grupo?.nombre}`, text: texto, url: linkGrupo });
    } else {
      navigator.clipboard.writeText(linkGrupo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} className="rounded-full flex-shrink-0 cursor-pointer"
      style={{ width: '41px', height: '22px', background: value ? '#C8AA6E' : 'rgba(200,170,110,0.15)', position: 'relative', transition: 'background .3s', opacity: guardando ? 0.6 : 1 }}>
      <div style={{ position: 'absolute', top: '2px', left: value ? '21px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left .3s', boxShadow: '0 2px 5px rgba(0,0,0,.3)' }} />
    </div>
  );

  const esCreador = grupo?.creadorId === user?.uid;
  const miPosicion = ranking.findIndex(r => r.esYo) + 1;
  const misPuntos = ranking.find(r => r.esYo)?.puntos || 0;

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">🏆</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p></div>
    </main>
  );

  if (!grupo) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <p style={{ color: 'rgba(210,185,130,0.65)' }}>Grupo no encontrado</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial/grupos')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>{grupo.nombre}</b></span>
          {esCreador && <span className="ml-auto text-xs px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E' }}>👑 Creador</span>}
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1" style={{ color: '#C8AA6E' }}>{grupo.nombre}</h1>
        <p className="text-xs mb-3" style={{ color: 'rgba(210,185,130,0.65)' }}>Mundial 2026 · Fase de Grupos</p>
        <div className="flex gap-2">
          <div className="flex-1 text-center rounded-xl py-2" style={{ background: 'rgba(200,170,110,0.08)' }}>
            <div className="font-condensed text-xl font-black" style={{ color: '#F5F5F0' }}>{grupo.miembros?.length || 1}</div>
            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Jugadores</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{ background: 'rgba(200,170,110,0.08)' }}>
            <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{misPuntos}</div>
            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mis pts</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{ background: 'rgba(200,170,110,0.08)' }}>
            <div className="font-condensed text-xl font-black" style={{ color: '#F5F5F0' }}>#{miPosicion > 0 ? miPosicion : '—'}</div>
            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Posición</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">

        <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.2)' }}>
          <div className="px-4 pt-4 pb-3 text-center">
            <div className="text-xs mb-1" style={{ color: 'rgba(210,185,130,0.55)' }}>Código del grupo</div>
            <div onClick={copiarCodigo} className="font-condensed text-4xl font-black tracking-widest mb-1 cursor-pointer" style={{ color: '#C8AA6E' }}>{grupo.codigo}</div>
            <div className="text-xs mb-3" style={{ color: copiado ? '#00C853' : 'rgba(210,185,130,0.45)' }}>
              {copiado ? '✅ Código copiado' : 'Tocá el código para copiarlo'}
            </div>
            <button onClick={() => setShowCompartir(!showCompartir)}
              className="w-full py-2 rounded-xl font-condensed font-black text-sm"
              style={{ background: 'rgba(200,170,110,0.1)', border: '1px solid rgba(200,170,110,0.25)', color: '#C8AA6E' }}>
              📤 COMPARTIR GRUPO
            </button>
          </div>
          {showCompartir && (
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <button onClick={compartirWhatsApp} className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}>📱 WhatsApp</button>
                <button onClick={compartirNativo} className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm" style={{ background: 'rgba(200,170,110,0.06)', border: '1px solid rgba(200,170,110,0.15)', color: 'rgba(210,185,130,0.75)' }}>🔗 Compartir</button>
                <button onClick={() => setShowQR(!showQR)} className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm" style={{ background: 'rgba(200,170,110,0.06)', border: '1px solid rgba(200,170,110,0.15)', color: '#C8AA6E' }}>📷 QR</button>
              </div>
              {showQR && (
                <div className="mt-3 rounded-xl p-4 text-center" style={{ background: 'white' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkGrupo)}`} alt="QR" className="mx-auto rounded-lg" width={200} height={200} />
                  <p className="text-xs mt-2 font-bold" style={{ color: '#020810' }}>{grupo.nombre} · {grupo.codigo}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={() => router.push(`/mundial/jugada/crear?grupo=${id}`)}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
          style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
          ⚽ CREAR JUGADA
        </button>

        <button onClick={() => router.push(`/mundial/grupo/${id}/jugadas`)}
          className="w-full py-3 rounded-xl font-condensed font-black text-base mb-3"
          style={{ background: 'rgba(200,170,110,0.06)', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.85)' }}>
          📋 VER TODAS LAS JUGADAS
        </button>

        {esCreador && (
          <button onClick={() => router.push(`/mundial/resultados/${id}`)}
            className="w-full py-3 rounded-xl font-condensed font-black text-base mb-3"
            style={{ background: 'rgba(200,170,110,0.08)', border: '1px solid rgba(200,170,110,0.25)', color: '#C8AA6E' }}>
            📊 CARGAR RESULTADOS
          </button>
        )}

        {grupo.chatHabilitado ? (
          <button onClick={() => router.push(`/mundial/chat/${id}`)}
            className="w-full py-3 rounded-xl font-condensed font-black text-base mb-4"
            style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)', color: '#00C853' }}>
            💬 CHAT DEL GRUPO
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl font-condensed font-bold text-base mb-4 text-center"
            style={{ background: 'rgba(200,170,110,0.03)', border: '1px solid rgba(200,170,110,0.1)', color: 'rgba(210,185,130,0.4)' }}>
            💬 Chat deshabilitado
          </div>
        )}

        <div className="flex mb-4" style={{ background: 'rgba(200,170,110,0.05)', borderRadius: '12px', padding: '3px', border: '1px solid rgba(200,170,110,0.1)' }}>
          {(['ranking', 'pagos', 'info'] as const).map(tabKey => (
            <div key={tabKey} onClick={() => setTab(tabKey)}
              className="flex-1 text-center py-2 rounded-xl cursor-pointer font-condensed font-bold text-sm"
              style={{ background: tab === tabKey ? '#0D1B3E' : 'transparent', color: tab === tabKey ? '#C8AA6E' : 'rgba(210,185,130,0.5)' }}>
              {tabKey === 'ranking' ? '🏆 Ranking' : tabKey === 'pagos' ? '💰 Pagos' : 'ℹ️ Info'}
            </div>
          ))}
        </div>

        {tab === 'ranking' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            {cargandoRanking ? (
              <div className="px-4 py-5 text-center"><div className="text-3xl mb-2">⏳</div><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando ranking...</p></div>
            ) : ranking.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <div className="text-3xl mb-2">⏳</div>
                <div className="font-condensed text-base font-bold mb-1" style={{ color: '#F5F5F0' }}>Sin jugadas todavía</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Sé el primero en crear tu jugada</div>
              </div>
            ) : (
              ranking.map((r, i) => (
                <div key={r.userId} className="flex items-center px-4 py-3"
                  style={{ borderBottom: i < ranking.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none', background: r.esYo ? 'rgba(200,170,110,0.05)' : 'transparent' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-condensed font-black text-sm mr-3 flex-shrink-0"
                    style={{ background: i === 0 ? 'linear-gradient(135deg,#C8AA6E,#8B6914)' : i === 1 ? 'rgba(192,192,192,0.15)' : i === 2 ? 'rgba(205,127,50,0.15)' : 'rgba(200,170,110,0.07)', color: i === 0 ? '#0d0d1a' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(210,185,130,0.5)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold" style={{ color: r.esYo ? '#C8AA6E' : '#F5F5F0' }}>
                      {r.nombre} {r.esYo && <span className="text-xs" style={{ color: 'rgba(210,185,130,0.55)' }}>(vos)</span>}
                    </div>
                  </div>
                  <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{r.puntos} pts</div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'pagos' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#F5F5F0' }}>Control de pagos internos</div>
                  <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>{grupo.precio ? `${grupo.moneda} ${grupo.precio} por jugada` : 'Sin monto definido'}</div>
                </div>
                {esCreador ? <Toggle value={grupo.controlPagos} onToggle={toggleControlPagos} /> : <span style={{ color: grupo.controlPagos ? '#00C853' : 'rgba(210,185,130,0.5)' }}>{grupo.controlPagos ? '✅' : '❌'}</span>}
              </div>
              {esCreador && grupo.controlPagos && (
                <>
                  <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(210,185,130,0.6)' }}>Jugadas del grupo</div>
                  {cargandoPagos ? (
                    <div className="text-center py-4"><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p></div>
                  ) : jugadasPagos.length === 0 ? (
                    <div className="text-center py-4"><p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>No hay jugadas todavía</p></div>
                  ) : (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(200,170,110,0.1)' }}>
                      {jugadasPagos.map((j, i) => (
                        <div key={j.id} className="flex items-center px-3 py-3"
                          style={{ borderBottom: i < jugadasPagos.length - 1 ? '1px solid rgba(200,170,110,0.07)' : 'none', background: j.pagadoInterno ? 'rgba(0,200,83,0.04)' : 'rgba(232,25,44,0.04)' }}>
                          <div className="flex-1">
                            <div className="text-sm font-bold" style={{ color: '#F5F5F0' }}>{j.nombreUsuario}</div>
                            <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>{j.nombre}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: j.pagadoInterno ? '#00C853' : '#FFB300' }}>{j.pagadoInterno ? '✅ Pagó' : '⏳ Pendiente'}</span>
                            <div onClick={() => togglePago(j.id, j.pagadoInterno || false)} className="rounded-full cursor-pointer flex-shrink-0"
                              style={{ width: '36px', height: '20px', background: j.pagadoInterno ? '#C8AA6E' : 'rgba(200,170,110,0.15)', position: 'relative', transition: 'background .3s' }}>
                              <div style={{ position: 'absolute', top: '2px', left: j.pagadoInterno ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left .3s', boxShadow: '0 2px 4px rgba(0,0,0,.3)' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {!esCreador && (
                <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(200,170,110,0.04)', border: '1px solid rgba(200,170,110,0.1)', color: 'rgba(210,185,130,0.65)' }}>
                  {grupo.controlPagos ? 'El creador gestiona los pagos del grupo.' : 'Este grupo no tiene control de pagos activo.'}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'info' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="px-4 py-4">
              {[{ label: 'Torneo', valor: 'Mundial 2026' }, { label: 'Fase', valor: 'Grupos (72 partidos)' }, { label: 'Jugadores', valor: String(grupo.miembros?.length || 1) }].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid rgba(200,170,110,0.07)' }}>
                  <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>{item.valor}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid rgba(200,170,110,0.07)' }}>
                <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Control de pagos</span>
                <span className="text-sm font-semibold" style={{ color: grupo.controlPagos ? '#00C853' : 'rgba(210,185,130,0.5)' }}>{grupo.controlPagos ? '✅ Activo' : '❌ Inactivo'}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid rgba(200,170,110,0.07)' }}>
                <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Chat</span>
                {esCreador ? <Toggle value={grupo.chatHabilitado} onToggle={toggleChat} /> : <span className="text-sm font-semibold" style={{ color: grupo.chatHabilitado ? '#00C853' : 'rgba(210,185,130,0.5)' }}>{grupo.chatHabilitado ? '✅' : '❌'}</span>}
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Código</span>
                <span className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>{grupo.codigo}</span>
              </div>
              {esCreador && (
                <button onClick={() => setShowEliminar(true)}
                  className="w-full py-3 rounded-xl font-condensed font-black text-base mt-4"
                  style={{ background: 'rgba(232,25,44,0.08)', border: '1px solid rgba(232,25,44,0.25)', color: '#E8192C' }}>
                  🗑️ ELIMINAR GRUPO
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {showEliminar && (
        <div className="fixed inset-0 flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 999 }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.2)' }}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-condensed text-xl font-black mb-2" style={{ color: '#E8192C' }}>Eliminar grupo</div>
              <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)', lineHeight: '1.7' }}>Esta acción es <b style={{ color: '#F5F5F0' }}>irreversible</b>. Se eliminarán el grupo y todas las jugadas asociadas.</p>
            </div>
            <button onClick={eliminarGrupo} disabled={eliminando}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{ background: '#E8192C', color: 'white', opacity: eliminando ? 0.7 : 1 }}>
              {eliminando ? 'ELIMINANDO...' : '🗑️ SÍ, ELIMINAR'}
            </button>
            <button onClick={() => setShowEliminar(false)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.75)' }}>
              CANCELAR
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏆</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Mundial</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/grupos')}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{ color: '#C8AA6E' }}>Grupos</span>
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