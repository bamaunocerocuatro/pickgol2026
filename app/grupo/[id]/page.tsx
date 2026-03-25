'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useIdioma } from '../../context/IdiomaContext';

const LIGAS: Record<string, string> = {
  premier: 'Premier League', laliga: 'La Liga', seriea: 'Serie A',
  bundesliga: 'Bundesliga', ligue1: 'Ligue 1', ligapro: 'Liga Profesional',
  brasileirao: 'Brasileirão',
};

export default function GrupoDashboard() {
  const router = useRouter();
  const { t } = useIdioma();
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
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'grupos', id));
        if (snap.exists()) {
          const grupoData = { id: snap.id, ...snap.data() } as any;
          setGrupo(grupoData);
          cargarRanking(id, u.uid);
          if (grupoData.controlPagos && grupoData.creadorId === u.uid) {
            cargarJugadasPagos(id);
          }
        }
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const cargarRanking = async (grupoId: string, uid: string) => {
    setCargandoRanking(true);
    try {
      const q = query(collection(db, 'jugadas'), where('grupoId', '==', grupoId));
      const snap = await getDocs(q);
      if (snap.empty) { setCargandoRanking(false); return; }
      const jugadas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const porUsuario: Record<string, any> = {};
      for (const j of jugadas) {
        const userId = j.userId;
        if (!porUsuario[userId] || (j.puntos || 0) > (porUsuario[userId].puntos || 0)) {
          porUsuario[userId] = j;
        }
      }
      const rankingData = await Promise.all(
        Object.entries(porUsuario).map(async ([userId, jugada]) => {
          let nombre = jugada.userEmail || 'Jugador';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', userId));
            if (usnap.exists()) {
              const udata = usnap.data();
              nombre = udata.displayName || udata.email || nombre;
            }
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
      const q = query(collection(db, 'jugadas'), where('grupoId', '==', grupoId));
      const snap = await getDocs(q);
      const jugadas = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      // Buscar nombre de cada jugador
      const jugadasConNombre = await Promise.all(
        jugadas.map(async (j) => {
          let nombre = j.userEmail || 'Jugador';
          try {
            const usnap = await getDoc(doc(db, 'usuarios', j.userId));
            if (usnap.exists()) {
              const udata = usnap.data();
              nombre = udata.displayName || udata.email || nombre;
            }
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
      await updateDoc(doc(db, 'jugadas', jugadaId), { pagadoInterno: !estadoActual });
      setJugadasPagos(prev => prev.map(j => j.id === jugadaId ? { ...j, pagadoInterno: !estadoActual } : j));
    } catch (e) {}
  };

  const esCreador = grupo?.creadorId === user?.uid;
  const miPosicion = ranking.findIndex(r => r.esYo) + 1;
  const misPuntos = ranking.find(r => r.esYo)?.puntos || 0;
  const linkGrupo = `https://pickgol2026.vercel.app/unirse?codigo=${grupo?.codigo}`;

  const copiarCodigo = () => {
    navigator.clipboard.writeText(grupo?.codigo || '');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirWhatsApp = () => {
    const texto = `¡Unite a mi grupo de predicciones en PickGol 2026! 🏆⚽\nGrupo: *${grupo?.nombre}*\nCódigo: *${grupo?.codigo}*\nEntrá acá: ${linkGrupo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const compartirNativo = async () => {
    const texto = `¡Unite a mi grupo de predicciones en PickGol 2026! 🏆⚽\nGrupo: ${grupo?.nombre}\nCódigo: ${grupo?.codigo}\nEntrá acá: ${linkGrupo}`;
    if (navigator.share) {
      await navigator.share({ title: `Grupo ${grupo?.nombre}`, text: texto, url: linkGrupo });
    } else {
      navigator.clipboard.writeText(linkGrupo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const toggleChat = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'grupos', id), { chatHabilitado: !grupo.chatHabilitado });
      setGrupo({ ...grupo, chatHabilitado: !grupo.chatHabilitado });
    } catch (e) {}
    setGuardando(false);
  };

  const toggleControlPagos = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'grupos', id), { controlPagos: !grupo.controlPagos });
      setGrupo({ ...grupo, controlPagos: !grupo.controlPagos });
      if (!grupo.controlPagos) cargarJugadasPagos(id);
    } catch (e) {}
    setGuardando(false);
  };

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} className="rounded-full flex-shrink-0 cursor-pointer"
      style={{width:'41px',height:'22px',background: value ? '#00C853' : 'rgba(255,255,255,0.1)',position:'relative',transition:'background .3s',opacity: guardando ? 0.6 : 1}}>
      <div style={{position:'absolute',top:'2px',left: value ? '21px' : '2px',width:'18px',height:'18px',background:'white',borderRadius:'50%',transition:'left .3s',boxShadow:'0 2px 5px rgba(0,0,0,.3)'}}/>
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">⚽</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  if (!grupo) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <p className="text-[#8892A4]">Grupo no encontrado</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/grupos')}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>{grupo.nombre}</b></span>
          {esCreador && (
            <span className="ml-auto text-xs px-2 py-1 rounded-lg font-bold" style={{background:'rgba(201,168,76,0.15)',color:'#C9A84C'}}>👑 {t.creador}</span>
          )}
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">{grupo.nombre}</h1>
        <p className="text-xs mb-3" style={{color:'#8892A4'}}>{LIGAS[grupo.liga] || grupo.liga} · {grupo.tipo === 'temporada' ? t.todaLaTemporada : t.fechasEsp}</p>

        <div className="flex gap-2">
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black">{grupo.miembros?.length || 1}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{t.jugadores}</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>{misPuntos}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{t.misPts}</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black">#{miPosicion > 0 ? miPosicion : '—'}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{t.posicion}</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* COMPARTIR GRUPO */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={{background:'linear-gradient(135deg,#0A1F5C,#0D2870)',border:'1px solid rgba(255,255,255,0.1)'}}>
          <div className="px-4 pt-4 pb-3 text-center">
            <div className="text-xs mb-1" style={{color:'rgba(255,255,255,0.4)'}}>Código del grupo</div>
            <div onClick={copiarCodigo} className="font-condensed text-4xl font-black tracking-widest mb-1 cursor-pointer" style={{color:'#C9A84C'}}>
              {grupo.codigo}
            </div>
            <div className="text-xs mb-3" style={{color: copiado ? '#00C853' : 'rgba(255,255,255,0.3)'}}>
              {copiado ? '✅ Código copiado' : 'Tocá el código para copiarlo'}
            </div>
            <button onClick={() => setShowCompartir(!showCompartir)}
              className="w-full py-2 rounded-xl font-condensed font-black text-sm"
              style={{background:'rgba(232,25,44,0.2)',border:'1px solid rgba(232,25,44,0.4)',color:'#E8192C'}}>
              📤 COMPARTIR GRUPO
            </button>
          </div>

          {showCompartir && (
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <button onClick={compartirWhatsApp}
                  className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm"
                  style={{background:'rgba(37,211,102,0.15)',border:'1px solid rgba(37,211,102,0.3)',color:'#25D366'}}>
                  📱 WhatsApp
                </button>
                <button onClick={compartirNativo}
                  className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm"
                  style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}>
                  🔗 Compartir
                </button>
                <button onClick={() => setShowQR(!showQR)}
                  className="flex-1 py-2 rounded-xl font-condensed font-bold text-sm"
                  style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',color:'#C9A84C'}}>
                  📷 QR
                </button>
              </div>
              {showQR && (
                <div className="mt-3 rounded-xl p-4 text-center" style={{background:'white'}}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkGrupo)}`}
                    alt="QR del grupo" className="mx-auto rounded-lg" width={200} height={200} />
                  <p className="text-xs mt-2 font-bold" style={{color:'#020810'}}>{grupo.nombre} · {grupo.codigo}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={() => router.push(`/jugada/crear?grupo=${id}`)}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
          style={{background:'#E8192C',color:'white'}}>
          ⚽ CREAR JUGADA
        </button>

        {esCreador && (
          <button onClick={() => router.push(`/resultados/${id}`)}
            className="w-full py-3 rounded-xl font-condensed font-black text-base mb-3"
            style={{background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)',color:'#C9A84C'}}>
            📊 CARGAR RESULTADOS
          </button>
        )}

        {grupo.chatHabilitado ? (
          <button onClick={() => router.push(`/chat/${id}`)}
            className="w-full py-3 rounded-xl font-condensed font-black text-base mb-4"
            style={{background:'rgba(0,200,83,0.15)',border:'1px solid rgba(0,200,83,0.3)',color:'#00C853'}}>
            💬 {t.chatGrupo.toUpperCase()}
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl font-condensed font-bold text-base mb-4 text-center"
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#8892A4'}}>
            💬 {t.chatGrupoSub}
          </div>
        )}

        <div className="flex mb-4" style={{background:'rgba(0,0,0,0.3)',borderRadius:'12px',padding:'3px'}}>
          {(['ranking','pagos','info'] as const).map(tabKey => (
            <div key={tabKey} onClick={() => setTab(tabKey)}
              className="flex-1 text-center py-2 rounded-xl cursor-pointer font-condensed font-bold text-sm"
              style={{background: tab === tabKey ? '#0D1B3E' : 'transparent', color: tab === tabKey ? '#F5F5F0' : '#8892A4'}}>
              {tabKey === 'ranking' ? '🏆 Ranking' : tabKey === 'pagos' ? '💰 Pagos' : 'ℹ️ Info'}
            </div>
          ))}
        </div>

        {tab === 'ranking' && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            {cargandoRanking ? (
              <div className="px-4 py-5 text-center"><div className="text-3xl mb-2">⏳</div><p className="text-sm" style={{color:'#8892A4'}}>Cargando ranking...</p></div>
            ) : ranking.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <div className="text-3xl mb-2">⏳</div>
                <div className="font-condensed text-base font-bold mb-1">{t.noJugadas}</div>
                <div className="text-xs" style={{color:'#8892A4'}}>{t.noJugadasSub}</div>
              </div>
            ) : (
              ranking.map((r, i) => (
                <div key={r.userId} className="flex items-center px-4 py-3"
                  style={{borderBottom: i < ranking.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: r.esYo ? 'rgba(232,25,44,0.07)' : 'transparent'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-condensed font-black text-sm mr-3 flex-shrink-0"
                    style={{background: i === 0 ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : i === 1 ? 'rgba(192,192,192,0.2)' : i === 2 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.07)', color: i === 0 ? '#020810' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#8892A4'}}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold" style={{color: r.esYo ? '#E8192C' : '#F5F5F0'}}>
                      {r.nombre} {r.esYo && <span className="text-xs" style={{color:'#8892A4'}}>(vos)</span>}
                    </div>
                  </div>
                  <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>{r.puntos} pts</div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'pagos' && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="px-4 py-4">
              {/* Toggle control pagos — solo creador */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold mb-1">{t.controlPagos}</div>
                  <div className="text-xs" style={{color:'#8892A4'}}>
                    {grupo.precio ? `${grupo.moneda} ${grupo.precio} por jugada` : 'Sin monto definido'}
                  </div>
                </div>
                {esCreador ? (
                  <Toggle value={grupo.controlPagos} onToggle={toggleControlPagos} />
                ) : (
                  <span className="text-sm font-bold" style={{color: grupo.controlPagos ? '#00C853' : '#8892A4'}}>
                    {grupo.controlPagos ? '✅' : '❌'}
                  </span>
                )}
              </div>

              {/* Lista de jugadas para marcar pagos — solo creador con control activo */}
              {esCreador && grupo.controlPagos && (
                <>
                  <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
                    Jugadas del grupo
                  </div>
                  {cargandoPagos ? (
                    <div className="text-center py-4"><p className="text-sm" style={{color:'#8892A4'}}>Cargando...</p></div>
                  ) : jugadasPagos.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm" style={{color:'#8892A4'}}>No hay jugadas creadas todavía</p>
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                      {jugadasPagos.map((j, i) => (
                        <div key={j.id} className="flex items-center px-3 py-3"
                          style={{borderBottom: i < jugadasPagos.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: j.pagadoInterno ? 'rgba(0,200,83,0.05)' : 'rgba(232,25,44,0.05)'}}>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{j.nombreUsuario}</div>
                            <div className="text-xs" style={{color:'#8892A4'}}>{j.nombre}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{color: j.pagadoInterno ? '#00C853' : '#FFB300'}}>
                              {j.pagadoInterno ? '✅ Pagó' : '⏳ Pendiente'}
                            </span>
                            <div onClick={() => togglePago(j.id, j.pagadoInterno || false)}
                              className="rounded-full cursor-pointer flex-shrink-0"
                              style={{width:'36px',height:'20px',background: j.pagadoInterno ? '#00C853' : 'rgba(255,255,255,0.1)',position:'relative',transition:'background .3s'}}>
                              <div style={{position:'absolute',top:'2px',left: j.pagadoInterno ? '18px' : '2px',width:'16px',height:'16px',background:'white',borderRadius:'50%',transition:'left .3s',boxShadow:'0 2px 4px rgba(0,0,0,.3)'}}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-xl p-3 mt-3 flex gap-2" style={{background:'rgba(232,25,44,0.07)',border:'1px solid rgba(232,25,44,0.2)'}}>
                    <span>⚠️</span>
                    <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>Las jugadas con pago pendiente quedan <b style={{color:'white'}}>inhabilitadas</b> automáticamente cuando empieza la fecha.</p>
                  </div>
                </>
              )}

              {/* Vista para no creadores */}
              {!esCreador && (
                <div className="text-xs px-3 py-2 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#8892A4'}}>
                  {grupo.controlPagos ? 'El creador gestiona los pagos del grupo.' : 'Este grupo no tiene control de pagos activo.'}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'info' && (
          <div className="rounded-2xl overflow-hidden" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="px-4 py-4">
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>{t.ligaLabel}</span>
                <span className="text-sm font-semibold">{LIGAS[grupo.liga] || grupo.liga}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>{t.duracion}</span>
                <span className="text-sm font-semibold">{grupo.tipo === 'temporada' ? t.todaLaTemporada : t.fechasEsp}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>{t.jugadores}</span>
                <span className="text-sm font-semibold">{grupo.miembros?.length || 1}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>{t.controlPagos}</span>
                <span className="text-sm font-semibold" style={{color: grupo.controlPagos ? '#00C853' : '#8892A4'}}>{grupo.controlPagos ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between items-center py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs" style={{color:'#8892A4'}}>{t.chatGrupo}</span>
                {esCreador ? (
                  <Toggle value={grupo.chatHabilitado} onToggle={toggleChat} />
                ) : (
                  <span className="text-sm font-semibold" style={{color: grupo.chatHabilitado ? '#00C853' : '#8892A4'}}>
                    {grupo.chatHabilitado ? '✅' : '❌'}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs" style={{color:'#8892A4'}}>{t.codigoGrupo}</span>
                <span className="font-condensed text-lg font-black" style={{color:'#C9A84C'}}>{grupo.codigo}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/inicio')}>
          <span className="text-lg">🏠</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.inicio}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.fixture}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/grupos')}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.grupos}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mis-jugadas')}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.jugadas}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.perfil}</span>
        </div>
      </div>

    </main>
  );
}