'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function JugadaCreadaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const grupoId = searchParams.get('grupo');
  const jugadaId = searchParams.get('jugada');

  const [user, setUser] = useState<any>(null);
  const [jugada, setJugada] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compartiendo, setCompartiendo] = useState(false);
  const [mensajeCopiado, setMensajeCopiado] = useState('');
  const tarjetaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      if (jugadaId) {
        try {
          const snap = await getDoc(doc(db, 'jugadas_mundial', jugadaId));
          if (snap.exists()) setJugada({ id: snap.id, ...snap.data() });
        } catch (e) {}
      }
      setLoading(false);
    });
    return () => unsub();
  }, [jugadaId]);

  const generarImagen = async (): Promise<string | null> => {
    if (!tarjetaRef.current) return null;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tarjetaRef.current, {
        backgroundColor: '#0d0d1a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 400,
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  };

  const descargarImagen = async () => {
    setCompartiendo(true);
    const img = await generarImagen();
    if (img) {
      const a = document.createElement('a');
      a.href = img;
      a.download = 'pickgol-mundial-2026.png';
      a.click();
      setMensajeCopiado('✅ Imagen guardada');
      setTimeout(() => setMensajeCopiado(''), 3000);
    }
    setCompartiendo(false);
  };

  const compartirWhatsApp = () => {
    const texto = `¡Hice mi jugada del Mundial 2026 en PickGol! 🏆⚽\n\nDescargá la app y armá tu prode: https://pickgol.com\n\n#pickgol #pickgolapp #pickgol2026`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const compartirInstagram = async () => {
    setCompartiendo(true);
    const hashtags = '#pickgol #pickgolapp #pickgol2026';
    const img = await generarImagen();
    if (img) {
      const a = document.createElement('a');
      a.href = img;
      a.download = 'pickgol-mundial-2026.png';
      a.click();
    }
    try { await navigator.clipboard.writeText(hashtags); } catch (e) {}
    setMensajeCopiado('✅ Imagen guardada · Hashtags copiados');
    setTimeout(() => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isIOS) {
        window.location.href = 'instagram://app';
        setTimeout(() => window.open('https://instagram.com', '_blank'), 1500);
      } else if (isAndroid) {
        window.location.href = 'intent://instagram.com/#Intent;scheme=https;package=com.instagram.android;end';
        setTimeout(() => window.open('https://instagram.com', '_blank'), 1500);
      } else {
        window.open('https://instagram.com', '_blank');
      }
      setCompartiendo(false);
    }, 800);
  };

  const irAlGrupo = () => {
    if (grupoId) router.push(`/mundial/grupo/${grupoId}`);
    else router.push('/mundial');
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Cargando...</p>
      </div>
    </main>
  );

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Jugador';
  const predicciones = jugada?.predicciones || [];
  const variables = jugada?.variablesMeta || [];
  const respuestas = jugada?.variables || {};
  const mitad = Math.ceil(predicciones.length / 2);
  const col1 = predicciones.slice(0, mitad);
  const col2 = predicciones.slice(mitad);

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }}
        className="px-4 pt-6 pb-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="font-condensed text-3xl font-black mb-1" style={{ color: '#C8AA6E' }}>¡JUGADA CREADA!</h1>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Tu predicción del Mundial 2026 está lista</p>
      </div>

      <div className="px-4 py-4">

        {/* TARJETA */}
        <div ref={tarjetaRef} style={{
          background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)',
          border: '1px solid rgba(200,170,110,0.3)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '18px', fontWeight: '900', color: '#C8AA6E', letterSpacing: '1px' }}>PICKGOL 🏆</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '10px', color: 'rgba(210,185,130,0.5)' }}>FIFA World Cup 2026 · pickgol2026.vercel.app</div>
            </div>
          </div>

          <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(200,170,110,0.15)' }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: '16px', fontWeight: '900', color: '#F5F5F0' }}>{userName}</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: 'rgba(210,185,130,0.65)' }}>{jugada?.nombre || 'Mi jugada del Mundial'}</div>
          </div>

          {variables.length > 0 && (
            <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(200,170,110,0.15)' }}>
              <div style={{ fontFamily: 'sans-serif', fontSize: '9px', fontWeight: '700', color: 'rgba(210,185,130,0.5)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Variables</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                {variables.map((v: any) => (
                  <div key={v.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'sans-serif', fontSize: '9px', color: 'rgba(210,185,130,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {v.label.replace('¿Cuántas ', '').replace('¿Cuántos ', '').replace('¿Habrá ', '').replace('¿El VAR anulará algún gol?', 'VAR anula gol').replace('un gol antes del min 5 en algún partido?', 'Gol <5min').replace('gol en el alargue del 2do tiempo?', 'Gol alargue').replace('algún resultado 0-0?', '0-0').replace('?', '')}
                    </span>
                    <span style={{ fontFamily: 'sans-serif', fontSize: '9px', fontWeight: '900', color: '#C8AA6E', flexShrink: 0, marginLeft: '4px' }}>
                      {v.tipo === 'sino' ? (respuestas[v.key] === 'si' ? 'SÍ' : 'NO') : respuestas[v.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {predicciones.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: 'sans-serif', fontSize: '9px', fontWeight: '700', color: 'rgba(210,185,130,0.5)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>
                Predicciones · {predicciones.length} partidos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                <div>
                  {col1.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(200,170,110,0.05)' }}>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '8px', color: '#F5F5F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.local}</span>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '9px', fontWeight: '900', color: '#C8AA6E', flexShrink: 0, padding: '0 3px' }}>{p.golesLocalPredichos}-{p.golesVisitantePredichos}</span>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '8px', color: '#F5F5F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right' }}>{p.visitante}</span>
                    </div>
                  ))}
                </div>
                <div>
                  {col2.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(200,170,110,0.05)' }}>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '8px', color: '#F5F5F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.local}</span>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '9px', fontWeight: '900', color: '#C8AA6E', flexShrink: 0, padding: '0 3px' }}>{p.golesLocalPredichos}-{p.golesVisitantePredichos}</span>
                      <span style={{ fontFamily: 'sans-serif', fontSize: '8px', color: '#F5F5F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right' }}>{p.visitante}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(200,170,110,0.15)', fontFamily: 'sans-serif', fontSize: '9px', color: 'rgba(210,185,130,0.4)' }}>
            #pickgol #pickgolapp #pickgol2026
          </div>
        </div>

        {/* BOTONES COMPARTIR */}
        <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: 'rgba(210,185,130,0.6)' }}>
          Compartir mi jugada
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={compartirWhatsApp}
            className="flex-1 py-3 rounded-xl font-condensed font-bold text-sm flex items-center justify-center gap-1"
            style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}>
            📱 WhatsApp
          </button>
          <button onClick={compartirInstagram} disabled={compartiendo}
            className="flex-1 py-3 rounded-xl font-condensed font-bold text-sm flex items-center justify-center gap-1"
            style={{ background: 'rgba(225,48,108,0.12)', border: '1px solid rgba(225,48,108,0.3)', color: '#E1306C', opacity: compartiendo ? 0.7 : 1 }}>
            📸 Instagram
          </button>
          <button onClick={descargarImagen} disabled={compartiendo}
            className="flex-1 py-3 rounded-xl font-condensed font-bold text-sm flex items-center justify-center gap-1"
            style={{ background: 'rgba(200,170,110,0.08)', border: '1px solid rgba(200,170,110,0.2)', color: '#C8AA6E', opacity: compartiendo ? 0.7 : 1 }}>
            💾 Guardar
          </button>
        </div>

        {mensajeCopiado && (
          <p className="text-xs text-center mb-3 font-semibold" style={{ color: '#00C853' }}>{mensajeCopiado}</p>
        )}
        {compartiendo && (
          <p className="text-xs text-center mb-3" style={{ color: 'rgba(210,185,130,0.65)' }}>Generando imagen...</p>
        )}

        <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: 'rgba(200,170,110,0.05)', border: '1px solid rgba(200,170,110,0.12)' }}>
          <span>📋</span>
          <p className="text-xs" style={{ color: 'rgba(210,185,130,0.7)' }}>
            <b style={{ color: '#F5F5F0' }}>WhatsApp:</b> comparte el link directo.<br />
            <b style={{ color: '#F5F5F0' }}>Instagram:</b> descarga la imagen, copia los hashtags y abre Instagram automáticamente.
          </p>
        </div>

        {/* BANNER REFERIDOS */}
        <div onClick={() => router.push('/referidos')}
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
          style={{ background: 'rgba(200,170,110,0.07)', border: '1px solid rgba(200,170,110,0.25)' }}>
          <div className="text-3xl">🎁</div>
          <div className="flex-1">
            <div className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>
              ¿QUERÉS MÁS JUGADAS?
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.65)' }}>
              Invitá amigos · 3 referidos = 1 jugada gratis
            </div>
          </div>
          <div className="text-lg" style={{ color: 'rgba(200,170,110,0.3)' }}>›</div>
        </div>

        {/* BOTONES IR */}
        <button onClick={irAlGrupo}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-3"
          style={{ background: '#C8AA6E', color: '#0d0d1a' }}>
          {grupoId ? '👥 IR AL GRUPO →' : '🏆 IR AL MUNDIAL →'}
        </button>

        <button onClick={irAlGrupo}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.6)' }}>
          Saltar
        </button>

      </div>
    </main>
  );
}

export default function JugadaCreada() {
  return <Suspense><JugadaCreadaContent /></Suspense>;
}
