'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useIdioma } from '../context/IdiomaContext';

const LIGAS_NOMBRES: Record<string, string> = {
  premier: 'Premier League', laliga: 'La Liga', seriea: 'Serie A',
  bundesliga: 'Bundesliga', ligue1: 'Ligue 1', ligapro: 'Liga Profesional',
  brasileirao: 'Brasileirão',
};

export default function MisJugadas() {
  const router = useRouter();
  const { t } = useIdioma();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<Record<string, any>>({});
  const [cargando, setCargando] = useState(false);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<Record<string, boolean>>({});
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
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
          const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
          const { db: fireDb } = await import('../lib/firebase');
          const gsnap = await getDoc(firestoreDoc(fireDb, 'grupos', gid));
          if (gsnap.exists()) gruposData[gid] = { id: gsnap.id, ...gsnap.data() };
        }
        setGrupos(gruposData);

        const ligas = [...new Set(Object.values(gruposData).map((g: any) => g.liga).filter(Boolean))] as string[];
        const bloqueadas: Record<string, boolean> = {};
        for (const liga of ligas) {
          bloqueadas[liga] = await verificarFechaBloqueada(liga);
        }
        setFechasBloqueadas(bloqueadas);

      } catch (e) {}
      setCargando(false);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const verificarFechaBloqueada = async (liga: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/fixture?liga=${liga}`);
      const data = await res.json();
      const todos = data.partidos || [];

      const hoy = new Date();
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(hoy.getDate() - 7);

      const noJugados = todos.filter((p: any) => {
        if (p.estado !== 'NS') return false;
        return new Date(p.fecha) >= haceUnaSemana;
      });

      if (noJugados.length === 0) return true;

      const fechaMinStr = noJugados.map((p: any) => p.fecha).sort()[0];
      const fechaMin = new Date(fechaMinStr);
      const fechaMax = new Date(fechaMinStr);
      fechaMax.setDate(fechaMax.getDate() + 6);

      const todosEnVentana = todos.filter((p: any) => {
        const d = new Date(p.fecha);
        return d >= fechaMin && d <= fechaMax;
      });

      const primerNS = new Date(fechaMinStr);
      return todosEnVentana.some((p: any) => {
        const d = new Date(p.fecha);
        return p.estado !== 'NS' && d <= primerNS;
      });
    } catch (e) {
      return false;
    }
  };

  const eliminarJugada = async (jugadaId: string) => {
    setEliminando(jugadaId);
    try {
      await deleteDoc(doc(db, 'jugadas', jugadaId));
      setJugadas(prev => prev.filter(j => j.id !== jugadaId));
      setShowConfirm(null);
    } catch (e) {}
    setEliminando(null);
  };

  const formatFecha = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">⚽</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  // Separar jugadas de grupos y comunitarias
  const jugadasGrupos = jugadas.filter((j: any) => !j.comunitaria);
  const jugadasComunitarias = jugadas.filter((j: any) => j.comunitaria);

  const renderJugadaGrupo = (j: any) => {
    const grupo = grupos[j.grupoId];
    const ligaBloqueada = grupo ? fechasBloqueadas[grupo.liga] : false;
    const puedeEliminar = !ligaBloqueada;

    return (
      <div key={j.id} className="rounded-2xl mb-3 overflow-hidden"
        style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          <div className="flex-1">
            <div className="font-condensed text-base font-black">{j.nombre}</div>
            <div className="text-xs" style={{color:'#8892A4'}}>
              {grupo ? `${grupo.nombre} · ${LIGAS_NOMBRES[grupo.liga] || grupo.liga}` : t.sinGrupo}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>{j.puntos || 0} pts</div>
              <div className="text-xs" style={{color:'#8892A4'}}>{formatFecha(j.creadoEn)}</div>
            </div>
            <button
              onClick={() => puedeEliminar ? setShowConfirm(j.id) : null}
              disabled={!puedeEliminar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{
                background: puedeEliminar ? 'rgba(232,25,44,0.15)' : 'rgba(255,255,255,0.05)',
                border: puedeEliminar ? '1px solid rgba(232,25,44,0.3)' : '1px solid rgba(255,255,255,0.07)',
                color: puedeEliminar ? '#E8192C' : '#444',
                cursor: puedeEliminar ? 'pointer' : 'not-allowed'
              }}>
              🗑️
            </button>
          </div>
        </div>

        {/* Variables */}
        {j.variables && Object.keys(j.variables).length > 0 && (
          <div className="px-4 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{color:'#8892A4'}}>Variables</div>
            <div className="grid grid-cols-2 gap-1">
              {j.variablesMeta?.map((meta: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-0.5">
                  <span className="text-xs" style={{color:'#8892A4'}}>{meta.label.replace('¿Cuántas ', '').replace('¿Cuántos ', '').replace('¿Habrá ', '').replace('¿El VAR anulará algún gol?', 'VAR gol').replace('?', '')}</span>
                  <span className="text-xs font-bold">
                    {meta.tipo === 'sino' ? (j.variables[meta.key] === 'si' ? 'SÍ' : 'NO') : j.variables[meta.key] ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predicciones de partidos */}
        {j.predicciones && j.predicciones.length > 0 && (
          <div className="px-4 py-3">
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{color:'#8892A4'}}>Predicciones</div>
            {j.predicciones.map((p: any, i: number) => (
              <div key={i} className="flex items-center py-1">
                <span className="flex-1 text-xs font-semibold truncate">{p.local}</span>
                <span className="font-condensed text-sm font-black px-3" style={{color:'#C9A84C'}}>
                  {p.golesLocalPredichos} - {p.golesVisitantePredichos}
                </span>
                <span className="flex-1 text-xs font-semibold truncate text-right">{p.visitante}</span>
              </div>
            ))}
          </div>
        )}

        {grupo?.controlPagos && (
          <div className="px-4 py-2" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <span className="text-xs px-2 py-1 rounded-lg font-bold"
              style={{background: j.pagadoInterno ? 'rgba(0,200,83,0.1)' : 'rgba(255,179,0,0.1)', color: j.pagadoInterno ? '#00C853' : '#FFB300'}}>
              {j.pagadoInterno ? t.pagadoConfirmado : t.pagoPendiente}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderJugadaComunitaria = (j: any) => (
    <div key={j.id} className="rounded-2xl mb-3 overflow-hidden"
      style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
      <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="flex-1">
          <div className="font-condensed text-base font-black">🌍 {LIGAS_NOMBRES[j.liga] || j.liga}</div>
          <div className="text-xs" style={{color:'#8892A4'}}>
            Prode Comunitario{j.jornada ? ` · Jornada ${j.jornada}` : ''}
          </div>
        </div>
        <div className="text-right">
          <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>{j.puntos || 0} pts</div>
          <div className="text-xs" style={{color:'#8892A4'}}>{formatFecha(j.creadoEn)}</div>
        </div>
      </div>

      {j.predicciones && j.predicciones.length > 0 && (
        <div className="px-4 py-3">
          <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{color:'#8892A4'}}>Predicciones</div>
          {j.predicciones.map((p: any, i: number) => (
            <div key={i} className="flex items-center py-1">
              <span className="flex-1 text-xs font-semibold truncate">{p.local}</span>
              <span className="font-condensed text-sm font-black px-3" style={{color:'#C9A84C'}}>
                {p.golesLocalPredichos} - {p.golesVisitantePredichos}
              </span>
              <span className="flex-1 text-xs font-semibold truncate text-right">{p.visitante}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <h1 className="font-condensed text-3xl font-black mb-1">{t.jugadas} 🎯</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>{t.misJugadasSub}</p>
      </div>

      <div className="px-4 py-4">
        {cargando && <div className="text-center py-10"><div className="text-4xl mb-3">⏳</div><p className="text-sm" style={{color:'#8892A4'}}>{t.cargandoJugadas}</p></div>}

        {!cargando && jugadas.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-4xl mb-3">⚽</div>
            <div className="font-condensed text-lg font-bold mb-2">{t.noJugadas}</div>
            <div className="text-xs mb-4" style={{color:'#8892A4'}}>{t.noJugadasSub}</div>
            <button onClick={() => router.push('/grupos')}
              className="w-full py-3 rounded-xl font-condensed font-black text-base"
              style={{background:'#E8192C',color:'white'}}>
              {t.irGrupos}
            </button>
          </div>
        )}

        {!cargando && jugadasGrupos.length > 0 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
              👥 Jugadas de grupos
            </div>
            {jugadasGrupos.map(renderJugadaGrupo)}
          </>
        )}

        {!cargando && jugadasComunitarias.length > 0 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3 mt-4" style={{color:'#8892A4'}}>
              🌍 Prode Comunitario
            </div>
            {jugadasComunitarias.map(renderJugadaComunitaria)}
          </>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center px-5"
          style={{background:'rgba(0,0,0,0.85)',zIndex:999}}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{background:'#0D1B3E',border:'1px solid rgba(232,25,44,0.3)'}}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🗑️</div>
              <div className="font-condensed text-xl font-black mb-2" style={{color:'#E8192C'}}>Eliminar jugada</div>
              <p className="text-xs" style={{color:'#8892A4',lineHeight:'1.7'}}>
                Esta acción es <b style={{color:'white'}}>irreversible</b>. Se eliminará la jugada y todas sus predicciones.
              </p>
            </div>
            <button onClick={() => eliminarJugada(showConfirm)}
              disabled={eliminando === showConfirm}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{background:'#E8192C',color:'white',opacity: eliminando ? 0.7 : 1}}>
              {eliminando === showConfirm ? 'ELIMINANDO...' : '🗑️ SÍ, ELIMINAR'}
            </button>
            <button onClick={() => setShowConfirm(null)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}>
              CANCELAR
            </button>
          </div>
        </div>
      )}

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
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{color:'#E8192C'}}>{t.jugadas}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.perfil}</span>
        </div>
      </div>
    </main>
  );
}