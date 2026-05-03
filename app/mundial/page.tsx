'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const FECHA_HABILITACION = new Date('2026-01-01T00:00:00-03:00');
const FECHA_BLOQUEO = new Date('2026-06-09T17:00:00-03:00');

export default function Mundial() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mejorJugada, setMejorJugada] = useState<any>(null);
  const [posicionGlobal, setPosicionGlobal] = useState<number | null>(null);

  const ahora = new Date();
  const habilitado = ahora >= FECHA_HABILITACION;
  const bloqueado = ahora >= FECHA_BLOQUEO;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) {}
      try {
        const q = query(
          collection(db, 'jugadas_mundial'),
          where('userId', '==', u.uid),
          where('tipo', '==', 'mundial2026')
        );
        const snap2 = await getDocs(q);
        if (!snap2.empty) {
          const jugadas = snap2.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          const mejor = jugadas.reduce((a, b) => (a.puntos || 0) > (b.puntos || 0) ? a : b);
          setMejorJugada(mejor);
          const qTodos = query(
            collection(db, 'jugadas_mundial'),
            where('tipo', '==', 'mundial2026')
          );
          const snapTodos = await getDocs(qTodos);
          const todos = snapTodos.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          const porUsuario: Record<string, number> = {};
          todos.forEach((j: any) => {
            if (!porUsuario[j.userId] || (j.puntos || 0) > porUsuario[j.userId]) {
              porUsuario[j.userId] = j.puntos || 0;
            }
          });
          const ranking = Object.values(porUsuario).sort((a, b) => b - a);
          const pos = ranking.indexOf(mejor.puntos || 0) + 1;
          setPosicionGlobal(pos);
        }
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalReferidos = userData?.totalReferidos || 0;
  const jugadasDisponibles = userData?.plus ? '∞' : (userData?.jugadasMundialGratis ?? 1);

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }} className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Inicio · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Mundial 2026</b></span>
        </div>

        <div className="inline-block px-3 py-1 rounded-full mb-3 text-xs font-bold"
          style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E', border: '1px solid rgba(200,170,110,0.25)' }}>
          FIFA WORLD CUP 2026
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl">🏆</span>
          <div>
            <h1 className="font-condensed text-3xl font-black" style={{ color: '#C8AA6E' }}>MUNDIAL 2026</h1>
            <p className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>USA · Canadá · México · Fase de Grupos</p>
          </div>
        </div>

        <div className="mt-3">
          {!habilitado && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(200,170,110,0.1)', color: 'rgba(210,185,130,0.75)', border: '1px solid rgba(200,170,110,0.2)' }}>
              🔒 Disponible desde el 15 de mayo
            </div>
          )}
          {habilitado && bloqueado && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,200,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,200,0,0.25)' }}>
              🔒 Jugadas cerradas — Mundial en curso
            </div>
          )}
          {habilitado && !bloqueado && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853', border: '1px solid rgba(0,200,83,0.25)' }}>
              ✅ Jugadas abiertas
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4">

        {habilitado && (
          <>
            {/* CUADRO DE PUNTAJE */}
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.2)' }}>
              <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color: 'rgba(210,185,130,0.6)' }}>
                Tu posición
              </div>
              <div className="flex gap-2">
                <div className="flex-1 text-center rounded-xl py-3"
                  style={{ background: 'rgba(200,170,110,0.08)' }}>
                  <div className="font-condensed text-2xl font-black" style={{ color: '#C8AA6E' }}>
                    {mejorJugada ? mejorJugada.puntos || 0 : '—'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Mis pts</div>
                </div>
                <div className="flex-1 text-center rounded-xl py-3"
                  style={{ background: 'rgba(200,170,110,0.08)' }}>
                  <div className="font-condensed text-2xl font-black" style={{ color: '#F5F5F0' }}>
                    {posicionGlobal ? `#${posicionGlobal}` : '—'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>Posición</div>
                </div>
                <div className="flex-1 text-center rounded-xl py-3"
                  style={{ background: 'rgba(200,170,110,0.08)' }}>
                  <div className="font-condensed text-2xl font-black" style={{ color: userData?.plus ? '#C8AA6E' : '#F5F5F0' }}>
                    {jugadasDisponibles}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(210,185,130,0.65)' }}>
                    {userData?.plus ? '⭐ Plus' : 'Jugadas'}
                  </div>
                </div>
              </div>
              {mejorJugada && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,170,110,0.1)' }}>
                  <div className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>
                    Mejor jugada: <b style={{ color: '#C8AA6E' }}>{mejorJugada.nombre}</b>
                  </div>
                </div>
              )}
            </div>

            {/* REFERIDOS */}
            <div onClick={() => router.push('/referidos')}
              className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
              style={{ background: 'rgba(200,170,110,0.07)', border: '1px solid rgba(200,170,110,0.25)' }}>
              <div className="text-3xl">🎁</div>
              <div className="flex-1">
                <div className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>
                  INVITÁ AMIGOS · GANÁ JUGADAS
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.65)' }}>
                  {totalReferidos} referido{totalReferidos !== 1 ? 's' : ''} · 3 referidos = 1 jugada gratis
                </div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            {/* CREAR GRUPO */}
            {!bloqueado && (
              <button onClick={() => router.push('/mundial/crear-grupo')}
                className="w-full rounded-2xl p-4 mb-3 flex items-center gap-3 text-left"
                style={{ background: '#C8AA6E' }}>
                <div className="text-3xl">👥</div>
                <div className="flex-1">
                  <div className="font-condensed text-lg font-black" style={{ color: '#0d0d1a' }}>CREAR GRUPO</div>
                  <div className="text-xs" style={{ color: 'rgba(13,13,26,0.65)' }}>Jugá con tus amigos en un grupo privado</div>
                </div>
                <div className="text-lg" style={{ color: 'rgba(13,13,26,0.4)' }}>›</div>
              </button>
            )}

            <div onClick={() => router.push('/mundial/grupos')}
              className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
              style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              <div className="text-3xl">🏅</div>
              <div className="flex-1">
                <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>MIS GRUPOS</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Ver y gestionar tus grupos del Mundial</div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            {!bloqueado && (
              <div onClick={() => router.push('/unirse?mundial=1')}
                className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
                style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
                <div className="text-3xl">🔗</div>
                <div className="flex-1">
                  <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>UNIRME A UN GRUPO</div>
                  <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Ingresá un código de grupo</div>
                </div>
                <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
              </div>
            )}

            <div onClick={() => router.push('/mundial/prode-comunitario')}
              className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
              style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              <div className="text-3xl">🌍</div>
              <div className="flex-1">
                <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>PRODE COMUNITARIO</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Todos contra todos · Gratis · Una jugada</div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            <div onClick={() => router.push('/mundial/fixture')}
              className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
              style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              <div className="text-3xl">📅</div>
              <div className="flex-1">
                <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>FIXTURE</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Todos los partidos de la fase de grupos</div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            <div onClick={() => router.push('/mundial/ranking')}
              className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
              style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              <div className="text-3xl">🏆</div>
              <div className="flex-1">
                <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>RANKING GLOBAL</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Todos los jugadores del Mundial</div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            <div onClick={() => router.push('/mundial/mis-jugadas')}
              className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
              style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <div className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>MIS JUGADAS</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.65)' }}>Tus predicciones del Mundial</div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            {/* IR A LIGAS */}
            <div onClick={() => router.push('/mundial')}
              className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
              style={{ background: 'rgba(200,170,110,0.04)', border: '1px solid rgba(200,170,110,0.12)' }}>
              <div className="text-3xl">⚽</div>
              <div className="flex-1">
                <div className="font-condensed text-lg font-black" style={{ color: 'rgba(210,185,130,0.75)' }}>IR A LIGAS</div>
                <div className="text-xs" style={{ color: 'rgba(210,185,130,0.45)' }}>Premier, La Liga, Serie A y más</div>
              </div>
              <div className="text-lg" style={{ color: 'rgba(200,170,110,0.2)' }}>›</div>
            </div>
          </>
        )}

        {/* PRÓXIMAMENTE */}
        {!habilitado && (
          <div className="rounded-2xl p-6 text-center mt-4"
            style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.15)' }}>
            <div className="text-5xl mb-3">⏳</div>
            <div className="font-condensed text-xl font-black mb-2" style={{ color: '#C8AA6E' }}>PRÓXIMAMENTE</div>
            <p className="text-sm mb-1" style={{ color: 'rgba(210,185,130,0.65)' }}>El Mundial 2026 abre el</p>
            <p className="font-condensed text-lg font-black" style={{ color: '#C8AA6E' }}>15 de mayo de 2026</p>
            <p className="text-xs mt-3" style={{ color: 'rgba(210,185,130,0.55)' }}>USA · Canadá · México · 48 equipos · 104 partidos</p>

            <div onClick={() => router.push('/referidos')}
              className="rounded-2xl p-4 mt-4 flex items-center gap-3 cursor-pointer text-left"
              style={{ background: 'rgba(200,170,110,0.07)', border: '1px solid rgba(200,170,110,0.2)' }}>
              <div className="text-2xl">🎁</div>
              <div className="flex-1">
                <div className="font-condensed text-sm font-black" style={{ color: '#C8AA6E' }}>INVITÁ AMIGOS AHORA</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.65)' }}>Acumulá jugadas gratis antes del inicio del Mundial</div>
              </div>
              <div style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
            </div>

            <div onClick={() => router.push('/mundial')}
              className="rounded-2xl p-4 mt-3 flex items-center gap-3 cursor-pointer text-left"
              style={{ background: 'rgba(200,170,110,0.04)', border: '1px solid rgba(200,170,110,0.12)' }}>
              <div className="text-2xl">⚽</div>
              <div className="flex-1">
                <div className="font-condensed text-sm font-black" style={{ color: 'rgba(210,185,130,0.75)' }}>IR A LIGAS</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.45)' }}>Premier, La Liga, Serie A y más</div>
              </div>
              <div style={{ color: 'rgba(200,170,110,0.2)' }}>›</div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(200,170,110,0.1)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial')}>
          <span className="text-lg">🏠</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/fixture')}>
          <span className="text-lg">📅</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/grupos')}>
          <span className="text-lg">👥</span>
          <span className="text-xs font-semibold" style={{ color: '#C8AA6E' }}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mundial/mis-jugadas')}>
          <span className="text-lg">🎯</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{ color: 'rgba(210,185,130,0.5)' }}>Perfil</span>
        </div>
      </div>

    </main>
  );
}
