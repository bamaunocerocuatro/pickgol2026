'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useIdioma } from '../context/IdiomaContext';

const LIGAS = [
  { id: 'bundesliga', nombre: 'Bundesliga', pais: 'Alemania', bandera: '/flags/ger.png', proximamente: false },
  { id: 'ligapro', nombre: 'Liga Profesional', pais: 'Argentina', bandera: '/flags/arg.png', proximamente: true },
  { id: 'primera-b', nombre: 'Primera B Nacional', pais: 'Argentina', bandera: '/flags/arg.png', proximamente: true },
  { id: 'brasileirao', nombre: 'Brasileirão', pais: 'Brasil', bandera: '/flags/bra.png', proximamente: false },
  { id: 'laliga', nombre: 'La Liga', pais: 'España', bandera: '/flags/esp.png', proximamente: false },
  { id: 'ligue1', nombre: 'Ligue 1', pais: 'Francia', bandera: '/flags/fra.png', proximamente: false },
  { id: 'premier', nombre: 'Premier League', pais: 'Inglaterra', bandera: '/flags/eng.png', proximamente: false },
  { id: 'seriea', nombre: 'Serie A', pais: 'Italia', bandera: '/flags/ita.png', proximamente: false },
];

function InicioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, ready } = useIdioma();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [yaInstalada, setYaInstalada] = useState(false);
  const [mejorJugada, setMejorJugada] = useState<any>(null);
  const [posicionGlobal, setPosicionGlobal] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          if (!data.onboardingVisto) {
            router.push('/onboarding');
            return;
          }
          if (!searchParams.get('ligas')) {
            router.push('/mundial');
            return;
          }
        }
      } catch (e) {}

      // Cargar mejor jugada de ligas
      try {
        const q = query(collection(db, 'jugadas'), where('userId', '==', u.uid));
        const snap2 = await getDocs(q);
        if (!snap2.empty) {
          const jugadas = snap2.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          const mejor = jugadas.reduce((a, b) => (a.puntos || 0) > (b.puntos || 0) ? a : b);
          setMejorJugada(mejor);

          // Calcular posición global
          const qTodos = query(collection(db, 'jugadas'));
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

    if (window.matchMedia('(display-mode: standalone)').matches) setYaInstalada(true);
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => { unsub(); window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setYaInstalada(true);
    setInstallPrompt(null);
  };

  if (loading || !ready) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⚽</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  const totalReferidos = userData?.totalReferidos || 0;
  const inicial = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0A1F5C,#0D2870)', borderBottom: '1px solid rgba(255,255,255,0.07)' }} className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/mundial')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Mundial · <b style={{ color: 'rgba(255,255,255,0.8)' }}>Ligas</b></span>
          <div onClick={() => router.push('/perfil')}
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center font-condensed text-xs font-bold cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#8B0018,#E8192C)', color: 'white' }}>
            {inicial}
          </div>
        </div>

        <div className="inline-block px-3 py-1 rounded-full mb-3 text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
          ⚽ LIGAS 2025/26
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl">⚽</span>
          <div>
            <h1 className="font-condensed text-3xl font-black" style={{ color: '#F5F5F0' }}>PREDICCIÓN DE LIGAS</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Premier · La Liga · Serie A · y más</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853', border: '1px solid rgba(0,200,83,0.25)' }}>
            ✅ Jugadas abiertas · Gratis
          </div>
        </div>
      </div>

      <div className="px-4 py-4">

        {!yaInstalada && installPrompt && (
          <div onClick={handleInstall} className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#0A1F5C,#0D2870)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <div className="text-3xl">📲</div>
            <div className="flex-1">
              <div className="font-condensed text-lg font-black">{t.descargar}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.descargarSub}</div>
            </div>
            <div className="text-[#C9A84C] text-lg">↓</div>
          </div>
        )}

        {/* IR AL MUNDIAL */}
        <div onClick={() => router.push('/mundial')}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#C9A84C,#8B6914)' }}>
          <div className="text-3xl">🏆</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black" style={{ color: '#0d0d1a' }}>IR AL MUNDIAL 2026</div>
            <div className="text-xs" style={{ color: 'rgba(13,13,26,0.65)' }}>USA · Canadá · México · 1 jugada gratis</div>
          </div>
          <div className="text-lg" style={{ color: 'rgba(13,13,26,0.4)' }}>›</div>
        </div>

        {/* CUADRO TU POSICIÓN */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#8892A4' }}>
            Tu posición
          </div>
          <div className="flex gap-2">
            <div className="flex-1 text-center rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="font-condensed text-2xl font-black" style={{ color: '#C9A84C' }}>
                {mejorJugada ? mejorJugada.puntos || 0 : '—'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8892A4' }}>{t.misPts}</div>
            </div>
            <div className="flex-1 text-center rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="font-condensed text-2xl font-black" style={{ color: '#F5F5F0' }}>
                {posicionGlobal ? `#${posicionGlobal}` : '—'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8892A4' }}>{t.posicion}</div>
            </div>
            <div className="flex-1 text-center rounded-xl py-3 cursor-pointer"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
              onClick={() => router.push('/referidos')}>
              <div className="font-condensed text-2xl font-black" style={{ color: '#C9A84C' }}>{totalReferidos}</div>
              <div className="text-xs mt-1 font-bold" style={{ color: '#C9A84C' }}>{t.referidos} 🎁</div>
            </div>
          </div>
          {mejorJugada && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs" style={{ color: '#8892A4' }}>
                Mejor jugada: <b style={{ color: '#F5F5F0' }}>{mejorJugada.nombre}</b>
              </div>
            </div>
          )}
        </div>

        {/* REFERIDOS */}
        <div onClick={() => router.push('/referidos')}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
          style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <div className="text-3xl">🎁</div>
          <div className="flex-1">
            <div className="font-condensed text-base font-black" style={{ color: '#C9A84C' }}>INVITÁ AMIGOS · GANÁ JUGADAS</div>
            <div className="text-xs mt-0.5" style={{ color: '#8892A4' }}>
              {totalReferidos} referido{totalReferidos !== 1 ? 's' : ''} · 3 referidos = 1 jugada gratis (Mundial)
            </div>
          </div>
          <div className="text-lg" style={{ color: 'rgba(201,168,76,0.3)' }}>›</div>
        </div>

        {/* HACETE PLUS */}
        {!userData?.plus && (
          <div onClick={() => router.push('/plus')}
            className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
            style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <div className="text-3xl">⭐</div>
            <div className="flex-1">
              <div className="font-condensed text-lg font-black" style={{ color: '#C9A84C' }}>HACETE PLUS</div>
              <div className="text-xs" style={{ color: '#8892A4' }}>Jugadas ilimitadas · Variables personalizadas · USD 2.79</div>
            </div>
            <div className="text-[#C9A84C] text-lg">›</div>
          </div>
        )}

        {/* CREAR GRUPO */}
        <button onClick={() => router.push('/crear-grupo')}
          className="w-full rounded-2xl p-4 mb-3 flex items-center gap-3 text-left"
          style={{ background: '#E8192C' }}>
          <div className="text-3xl">👥</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black" style={{ color: 'white' }}>{t.crearGrupo}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.crearGrupoSub}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </button>

        {/* MIS GRUPOS */}
        <div onClick={() => router.push('/grupos')}
          className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
          style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl">🏅</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.grupos}</div>
            <div className="text-xs" style={{ color: '#8892A4' }}>Ver y gestionar tus grupos de ligas</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* UNIRME */}
        <div onClick={() => router.push('/unirse')}
          className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
          style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl">🔗</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.unirme}</div>
            <div className="text-xs" style={{ color: '#8892A4' }}>{t.unirseDesc}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* PRODE COMUNITARIO */}
        <div onClick={() => router.push('/prode-comunitario')}
          className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
          style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl">🌍</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.prodeComunitario}</div>
            <div className="text-xs" style={{ color: '#8892A4' }}>{t.prodeComunitarioSub}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* FIXTURE */}
        <div onClick={() => router.push('/fixture')}
          className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
          style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl">📅</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.fixture}</div>
            <div className="text-xs" style={{ color: '#8892A4' }}>Próximos partidos de tus ligas</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* MIS JUGADAS */}
        <div onClick={() => router.push('/mis-jugadas')}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
          style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.jugadas}</div>
            <div className="text-xs" style={{ color: '#8892A4' }}>Tus predicciones de ligas</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        {/* LIGAS */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#8892A4' }}>
          {t.ligasDisponibles}
        </div>

        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
          {LIGAS.map((liga, i) => (
            <div key={liga.id} className="flex items-center px-4 py-3"
              style={{ borderBottom: i < LIGAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: liga.proximamente ? 'default' : 'pointer', opacity: liga.proximamente ? 0.6 : 1 }}
              onClick={() => !liga.proximamente && router.push(`/liga/${liga.id}`)}>
              <div className="w-8 h-6 rounded overflow-hidden mr-3 flex-shrink-0">
                <img src={liga.bandera} alt={liga.pais} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="flex-1">
                <div className="font-condensed text-base font-bold">{liga.nombre}</div>
                <div className="text-xs" style={{ color: '#8892A4' }}>{liga.pais}</div>
              </div>
              {liga.proximamente ? (
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: '#8892A4' }}>
                  🚧 {t.proximamente}
                </span>
              ) : (
                <div className="text-white/30">›</div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3"
        style={{ background: 'rgba(6,13,31,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/inicio?ligas=1')}>
          <span className="text-lg">🏠</span>
          <span className="text-xs font-semibold" style={{ color: '#E8192C' }}>{t.inicio}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/fixture')}>
          <span className="text-lg">📅</span>
          <span className="text-xs font-semibold" style={{ color: '#8892A4' }}>{t.fixture}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/grupos')}>
          <span className="text-lg">👥</span>
          <span className="text-xs font-semibold" style={{ color: '#8892A4' }}>{t.grupos}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/mis-jugadas')}>
          <span className="text-lg">🎯</span>
          <span className="text-xs font-semibold" style={{ color: '#8892A4' }}>{t.jugadas}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span>
          <span className="text-xs font-semibold" style={{ color: '#8892A4' }}>{t.perfil}</span>
        </div>
      </div>

    </main>
  );
}

export default function Inicio() {
  return <Suspense><InicioContent /></Suspense>;
}
