'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function MisJugadasMundial() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [jugadasGrupos, setJugadasGrupos] = useState<any[]>([]);
  const [jugadasComunitarias, setJugadasComunitarias] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [jugadaAbierta, setJugadaAbierta] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) cargarJugadas();
  }, [user]);

  const cargarJugadas = async () => {
    setCargando(true);
    try {
      const q1 = query(
        collection(db, 'jugadas_mundial'),
        where('userId', '==', user.uid),
        where('tipo', '==', 'mundial2026')
      );
      const snap1 = await getDocs(q1);
      setJugadasGrupos(snap1.docs.map(d => ({ id: d.id, ...d.data() })));

      const q2 = query(
        collection(db, 'jugadas_comunitarias_mundial'),
        where('userId', '==', user.uid),
        where('tipo', '==', 'mundial2026')
      );
      const snap2 = await getDocs(q2);
      setJugadasComunitarias(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
    setCargando(false);
  };

  const formatFecha = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  const totalJugadas = jugadasGrupos.length + jugadasComunitarias.length;

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Mis Jugadas</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>🎯 MIS JUGADAS</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>
          Mundial 2026 · {totalJugadas} jugada{totalJugadas !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-4 py-4">

        {cargando && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando jugadas...</p>
          </div>
        )}

        {!cargando && totalJugadas === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="text-4xl mb-3">🎯</div>
            <div className="font-condensed text-lg font-bold mb-2" style={{ color: '#F5F5F0' }}>Sin jugadas todavía</div>
            <div className="text-xs mb-4" style={{ color: 'rgba(210,185,130,0.65)' }}>Creá tu primera jugada del Mundial 2026</div>
            <button onClick={() => router.push('/mundial')}
              className="px-6 py-2 rounded-xl font-condensed font-black text-sm"
              style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
              IR AL MUNDIAL
            </button>
          </div>
        )}

        {/* JUGADAS DE GRUPOS */}
        {!cargando && jugadasGrupos.length > 0 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: 'rgba(210,185,130,0.6)' }}>
              Grupos privados · {jugadasGrupos.length} jugada{jugadasGrupos.length !== 1 ? 's' : ''}
            </div>
            {jugadasGrupos.map((j) => (
              <div key={j.id} className="rounded-2xl mb-3 overflow-hidden"
                style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setJugadaAbierta(jugadaAbierta === j.id ? null : j.id)}>
                  <div className="flex-1">
                    <div className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>{j.nombre}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.6)' }}>
                      Mundial 2026 · {j.creadoEn?.toDate ? formatFecha(j.creadoEn.toDate().toISOString()) : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{j.puntos || 0} pts</div>
                    <span style={{ color: 'rgba(210,185,130,0.45)' }}>{jugadaAbierta === j.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {jugadaAbierta === j.id && (
                  <div style={{ borderTop: '1px solid rgba(200,170,110,0.1)' }}>

                    {/* Variables */}
                    {j.variables && j.variablesMeta && (
                      <div className="px-4 py-3">
                        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2"
                          style={{ color: 'rgba(210,185,130,0.6)' }}>Variables</div>
                        {j.variablesMeta.map((v: any) => (
                          <div key={v.key} className="flex justify-between items-center py-1.5"
                            style={{ borderBottom: '1px solid rgba(200,170,110,0.06)' }}>
                            <span className="text-xs flex-1 mr-2" style={{ color: 'rgba(210,185,130,0.65)' }}>{v.label}</span>
                            <span className="text-xs font-bold flex-shrink-0" style={{ color: '#F5F5F0' }}>
                              {v.tipo === 'sino' ? (j.variables[v.key] === 'si' ? 'SÍ' : 'NO') : j.variables[v.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Predicciones */}
                    {j.predicciones && j.predicciones.length > 0 && (
                      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(200,170,110,0.1)' }}>
                        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2"
                          style={{ color: 'rgba(210,185,130,0.6)' }}>
                          Predicciones ({j.predicciones.length} partidos)
                        </div>
                        {j.predicciones.map((p: any, i: number) => (
                          <div key={i} className="flex items-center py-1.5"
                            style={{ borderBottom: i < j.predicciones.length - 1 ? '1px solid rgba(200,170,110,0.06)' : 'none' }}>
                            <div className="flex-1 text-xs truncate" style={{ color: '#F5F5F0' }}>{p.local}</div>
                            <div className="font-condensed text-sm font-black px-3 flex-shrink-0"
                              style={{ color: p.puntos > 0 ? '#00C853' : '#C8AA6E' }}>
                              {p.golesLocalPredichos} - {p.golesVisitantePredichos}
                              {p.puntos > 0 && <span className="text-xs ml-1" style={{ color: '#00C853' }}>+{p.puntos}</span>}
                            </div>
                            <div className="flex-1 text-xs text-right truncate" style={{ color: '#F5F5F0' }}>{p.visitante}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ir al grupo */}
                    {j.grupoId && (
                      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(200,170,110,0.1)' }}>
                        <button onClick={() => router.push(`/mundial/grupo/${j.grupoId}`)}
                          className="w-full py-2 rounded-xl font-condensed font-bold text-sm"
                          style={{ background: 'rgba(200,170,110,0.08)', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.85)' }}>
                          IR AL GRUPO →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* JUGADAS COMUNITARIAS */}
        {!cargando && jugadasComunitarias.length > 0 && (
          <>
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3 mt-2"
              style={{ color: 'rgba(210,185,130,0.6)' }}>
              Prode Comunitario
            </div>
            {jugadasComunitarias.map((j) => (
              <div key={j.id} className="rounded-2xl mb-3 overflow-hidden"
                style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setJugadaAbierta(jugadaAbierta === j.id ? null : j.id)}>
                  <div className="flex-1">
                    <div className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>🌍 Prode Comunitario</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial 2026 · Todos contra todos</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{j.puntos || 0} pts</div>
                    <span style={{ color: 'rgba(210,185,130,0.45)' }}>{jugadaAbierta === j.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {jugadaAbierta === j.id && j.predicciones && j.predicciones.length > 0 && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(200,170,110,0.1)' }}>
                    <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2"
                      style={{ color: 'rgba(210,185,130,0.6)' }}>
                      Predicciones ({j.predicciones.length} partidos)
                    </div>
                    {j.predicciones.map((p: any, i: number) => (
                      <div key={i} className="flex items-center py-1.5"
                        style={{ borderBottom: i < j.predicciones.length - 1 ? '1px solid rgba(200,170,110,0.06)' : 'none' }}>
                        <div className="flex-1 text-xs truncate" style={{ color: '#F5F5F0' }}>{p.local}</div>
                        <div className="font-condensed text-sm font-black px-3 flex-shrink-0"
                          style={{ color: p.puntos > 0 ? '#00C853' : '#C8AA6E' }}>
                          {p.golesLocalPredichos} - {p.golesVisitantePredichos}
                          {p.puntos > 0 && <span className="text-xs ml-1" style={{ color: '#00C853' }}>+{p.puntos}</span>}
                        </div>
                        <div className="flex-1 text-xs text-right truncate" style={{ color: '#F5F5F0' }}>{p.visitante}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏠</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/grupos')}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/mis-jugadas')}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{ color: '#C8AA6E' }}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Perfil</span>
        </div>
      </div>

    </main>
  );
}
