'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

export default function Inicio() {
  const router = useRouter();
  const { t, ready } = useIdioma();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [yaInstalada, setYaInstalada] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) setUserData(snap.data());
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
        <img src="/logo.png" className="w-16 h-16 mx-auto mb-3" />
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  const totalReferidos = userData?.totalReferidos || 0;

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <img src="/logo.png" className="w-8 h-8 rounded-lg" />
          <span className="font-condensed text-xl font-black text-[#C9A84C]">PickGol 2026</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">🔔</div>
            <div onClick={() => router.push('/perfil')}
              className="w-8 h-8 rounded-full flex items-center justify-center font-condensed text-xs font-bold cursor-pointer"
              style={{background:'linear-gradient(135deg,#8B0018,#E8192C)'}}>
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
          </div>
        </div>
        <p className="text-[#8892A4] text-xs mb-1">{t.bienvenido}</p>
        <h1 className="font-condensed text-2xl font-black mb-1">{user.displayName || user.email} ⚽</h1>
        <p className="text-xs mb-3" style={{color:'rgba(201,168,76,0.7)'}}>🥇 Tu mejor jugada · <span style={{color:'rgba(255,255,255,0.4)'}}>Próximamente</span></p>
        <div className="flex gap-2">
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>0</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{t.misPts}</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="font-condensed text-xl font-black">—</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{t.posicion}</div>
          </div>
          <div className="flex-1 text-center rounded-xl py-2 cursor-pointer"
            style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.25)'}}
            onClick={() => router.push('/referidos')}>
            <div className="font-condensed text-xl font-black" style={{color:'#C9A84C'}}>{totalReferidos}</div>
            <div className="text-xs font-bold" style={{color:'#C9A84C'}}>{t.referidos} 🎁</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">

        {!yaInstalada && installPrompt && (
          <div onClick={handleInstall} className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
            style={{background:'linear-gradient(135deg,#0A1F5C,#0D2870)',border:'1px solid rgba(201,168,76,0.3)'}}>
            <div className="text-3xl">📲</div>
            <div className="flex-1">
              <div className="font-condensed text-lg font-black">{t.descargar}</div>
              <div className="text-xs" style={{color:'rgba(255,255,255,0.6)'}}>{t.descargarSub}</div>
            </div>
            <div className="text-[#C9A84C] text-lg">↓</div>
          </div>
        )}

        <div className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer" style={{background:'linear-gradient(135deg,#E8192C,#8B0018)'}}>
          <div className="text-3xl">🏆</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.mundialTitulo}</div>
            <div className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>{t.mundialSub}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        <div onClick={() => router.push('/crear-grupo')}
          className="rounded-2xl p-4 mb-3 flex items-center gap-3 cursor-pointer"
          style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="text-3xl">👥</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.crearGrupo}</div>
            <div className="text-xs" style={{color:'#8892A4'}}>{t.crearGrupoSub}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        <div onClick={() => router.push('/prode-comunitario')}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
          style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="text-3xl">🌍</div>
          <div className="flex-1">
            <div className="font-condensed text-lg font-black">{t.prodeComunitario}</div>
            <div className="text-xs" style={{color:'#8892A4'}}>{t.prodeComunitarioSub}</div>
          </div>
          <div className="text-white/30 text-lg">›</div>
        </div>

        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3" style={{color:'#8892A4'}}>
          {t.ligasDisponibles}
        </div>

        <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
          {LIGAS.map((liga, i) => (
            <div key={liga.id} className="flex items-center px-4 py-3"
              style={{borderBottom: i < LIGAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: liga.proximamente ? 'default' : 'pointer', opacity: liga.proximamente ? 0.6 : 1}}
              onClick={() => !liga.proximamente && router.push(`/liga/${liga.id}`)}>
              <div className="w-8 h-6 rounded overflow-hidden mr-3 flex-shrink-0">
                <img src={liga.bandera} alt={liga.pais} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
              <div className="flex-1">
                <div className="font-condensed text-base font-bold">{liga.nombre}</div>
                <div className="text-xs" style={{color:'#8892A4'}}>{liga.pais}</div>
              </div>
              {liga.proximamente ? (
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.07)',color:'#8892A4'}}>
                  🚧 {t.proximamente}
                </span>
              ) : (
                <div className="text-white/30">›</div>
              )}
            </div>
          ))}
        </div>

      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/inicio')}>
          <span className="text-lg">🏠</span><span className="text-xs font-semibold" style={{color:'#E8192C'}}>{t.inicio}</span>
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