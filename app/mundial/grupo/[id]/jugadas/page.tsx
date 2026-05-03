'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function JugadasGrupoMundial() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');
  const [orden, setOrden] = useState<'az' | 'za'>('az');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      try {
        const grupoSnap = await getDoc(doc(db, 'grupos_mundial', id));
        if (!grupoSnap.exists()) { router.push('/mundial/grupos'); return; }
        setGrupo({ id: grupoSnap.id, ...grupoSnap.data() });

        const q = query(collection(db, 'jugadas_mundial'), where('grupoId', '==', id));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setJugadas(data);

        const userIds = [...new Set(data.map((j: any) => j.userId))];
        const nombresMap: Record<string, string> = {};
        for (const uid of userIds) {
          try {
            const usnap = await getDoc(doc(db, 'usuarios', uid as string));
            if (usnap.exists()) {
              const udata = usnap.data();
              nombresMap[uid as string] = udata.displayName || udata.email || 'Jugador';
            } else {
              const jugada = data.find((j: any) => j.userId === uid);
              nombresMap[uid as string] = jugada?.userEmail?.split('@')[0] || 'Jugador';
            }
          } catch (e) {
            nombresMap[uid as string] = 'Jugador';
          }
        }
        setUsuarios(nombresMap);
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  const jugadasFiltradas = filtroUsuario === 'todos'
    ? jugadas
    : jugadas.filter((j: any) => j.userId === filtroUsuario);

  const porUsuario: Record<string, any[]> = {};
  for (const j of jugadasFiltradas) {
    if (!porUsuario[j.userId]) porUsuario[j.userId] = [];
    porUsuario[j.userId].push(j);
  }

  const usuariosOrdenados = Object.keys(porUsuario).sort((a, b) => {
    const na = usuarios[a] || '';
    const nb = usuarios[b] || '';
    return orden === 'az' ? na.localeCompare(nb) : nb.localeCompare(na);
  });

  const userIds = [...new Set(jugadas.map((j: any) => j.userId))];

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push(`/mundial/grupo/${id}`)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>
            Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>{grupo?.nombre}</b>
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-3" style={{ color: '#C8AA6E' }}>📋 Todas las jugadas</h1>

        <div className="flex gap-2 mb-2">
          <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-xs outline-none font-semibold"
            style={{ background: 'rgba(200,170,110,0.1)', border: '1px solid rgba(200,170,110,0.25)', color: '#C8AA6E' }}>
            <option value="todos">👥 Todos los jugadores</option>
            {userIds.map((uid: any) => (
              <option key={uid} value={uid}>{usuarios[uid] || 'Jugador'}</option>
            ))}
          </select>
          <button onClick={() => setOrden(orden === 'az' ? 'za' : 'az')}
            className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(200,170,110,0.1)', border: '1px solid rgba(200,170,110,0.25)', color: '#C8AA6E' }}>
            {orden === 'az' ? 'A→Z' : 'Z→A'}
          </button>
        </div>
        <div className="text-xs" style={{ color: 'rgba(210,185,130,0.55)' }}>
          {jugadasFiltradas.length} jugada{jugadasFiltradas.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="px-4 py-4">

        {jugadasFiltradas.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="text-4xl mb-3">⚽</div>
            <div className="font-condensed text-lg font-bold" style={{ color: '#F5F5F0' }}>Sin jugadas todavía</div>
          </div>
        )}

        {usuariosOrdenados.map((uid) => (
          <div key={uid} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-condensed font-black text-sm"
                style={{ background: 'linear-gradient(135deg,#C8AA6E,#8B6914)', color: '#0d0d1a' }}>
                {(usuarios[uid] || 'J')[0].toUpperCase()}
              </div>
              <div className="font-condensed text-lg font-black" style={{ color: '#F5F5F0' }}>{usuarios[uid] || 'Jugador'}</div>
              <div className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(200,170,110,0.08)', color: 'rgba(210,185,130,0.6)' }}>
                {porUsuario[uid].length} jugada{porUsuario[uid].length !== 1 ? 's' : ''}
              </div>
            </div>

            {porUsuario[uid].map((j: any) => (
              <div key={j.id} className="rounded-2xl mb-3 overflow-hidden ml-4"
                style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>

                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(200,170,110,0.08)' }}>
                  <div className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>{j.nombre}</div>
                  <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>{j.puntos || 0} pts</div>
                </div>

                {/* Variables */}
                {j.variablesMeta && j.variablesMeta.length > 0 && j.variables && (
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(200,170,110,0.08)' }}>
                    <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2"
                      style={{ color: 'rgba(210,185,130,0.6)' }}>Variables</div>
                    <div className="grid grid-cols-2 gap-1">
                      {j.variablesMeta.map((meta: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-0.5">
                          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>
                            {meta.label.replace('¿Cuántas ', '').replace('¿Cuántos ', '').replace('¿Habrá ', '').replace('¿El VAR anulará algún gol?', 'VAR gol').replace('?', '')}
                          </span>
                          <span className="text-xs font-bold" style={{ color: '#F5F5F0' }}>
                            {meta.tipo === 'sino' ? (j.variables[meta.key] === 'si' ? 'SÍ' : 'NO') : j.variables[meta.key] ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predicciones */}
                {j.predicciones && j.predicciones.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2"
                      style={{ color: 'rgba(210,185,130,0.6)' }}>Predicciones</div>
                    {j.predicciones.map((p: any, i: number) => (
                      <div key={i} className="flex items-center py-1">
                        <span className="flex-1 text-xs font-semibold truncate" style={{ color: '#F5F5F0' }}>{p.local}</span>
                        <span className="font-condensed text-sm font-black px-3"
                          style={{ color: p.puntos > 0 ? '#00C853' : '#C8AA6E' }}>
                          {p.golesLocalPredichos} - {p.golesVisitantePredichos}
                          {p.puntos > 0 && <span className="text-xs ml-1" style={{ color: '#00C853' }}>+{p.puntos}</span>}
                        </span>
                        <span className="flex-1 text-xs font-semibold truncate text-right" style={{ color: '#F5F5F0' }}>{p.visitante}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏆</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Mundial</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
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