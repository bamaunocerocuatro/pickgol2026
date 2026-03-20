'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

declare global {
  interface Window { Paddle: any; }
}

export default function Plus() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) {}
      setLoading(false);
    });

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => {
      window.Paddle.Initialize({ token: 'live_dc281cbb836bab390f6cb2c282e' });
    };
    document.head.appendChild(script);

    return () => unsub();
  }, []);

  const handleComprar = () => {
    if (!user || !window.Paddle) return;
    window.Paddle.Checkout.open({
      items: [{ priceId: 'pri_01km4nm17rfbe8g8r3h45kgvkp', quantity: 1 }],
      customer: { email: user.email },
      settings: { successUrl: 'https://pickgol2026.vercel.app/plus?success=true' },
    });
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">⭐</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  const yaEsPlus = userData?.plus === true;

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => window.history.back()}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>PickGol Plus</span>
        </div>
        <div className="text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="font-condensed text-4xl font-black mb-1" style={{color:'#C9A84C'}}>PICKGOL PLUS</h1>
          <p className="text-sm" style={{color:'#8892A4'}}>Personalizá tu experiencia al máximo</p>
        </div>
      </div>

      <div className="px-4 py-4">

        {yaEsPlus ? (
          <div className="rounded-2xl p-6 text-center mb-4" style={{background:'rgba(0,200,83,0.1)',border:'1px solid rgba(0,200,83,0.3)'}}>
            <div className="text-4xl mb-3">✅</div>
            <div className="font-condensed text-2xl font-black mb-1" style={{color:'#00C853'}}>¡Ya sos Plus!</div>
            <p className="text-sm" style={{color:'#8892A4'}}>Tenés acceso a todas las funciones premium</p>
          </div>
        ) : (
          <>
            {/* PRECIO */}
            <div className="rounded-2xl p-5 mb-4 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(201,168,76,0.3)'}}>
              <div className="font-condensed text-5xl font-black mb-1" style={{color:'#C9A84C'}}>USD 2.59</div>
              <div className="text-sm" style={{color:'#8892A4'}}>Pago único · Para siempre</div>
            </div>

            {/* BENEFICIOS */}
            <div className="rounded-2xl overflow-hidden mb-5" style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.07)'}}>
              {[
                { icon: '🎯', titulo: 'Variables personalizadas', desc: 'Creá tus propias variables con el puntaje que quieras' },
                { icon: '✏️', titulo: 'Nombre y puntaje custom', desc: 'Definí cada variable a tu gusto en cada grupo' },
                { icon: '👑', titulo: 'Badge PLUS en tu perfil', desc: 'Mostrá que sos un creador premium' },
                { icon: '🔒', titulo: 'Para siempre', desc: 'Un solo pago, sin suscripciones' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-4"
                  style={{borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                  <div className="text-2xl">{b.icon}</div>
                  <div>
                    <div className="text-sm font-bold">{b.titulo}</div>
                    <div className="text-xs" style={{color:'#8892A4'}}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleComprar}
              className="w-full py-4 rounded-xl font-condensed font-black text-xl mb-3"
              style={{background:'linear-gradient(135deg,#C9A84C,#8B6914)',color:'#020810'}}>
              ⭐ ACTIVAR PLUS — USD 2.59
            </button>

            <p className="text-center text-xs" style={{color:'#8892A4'}}>
              Procesado por Paddle · Pago seguro ·{' '}
              <span className="cursor-pointer underline" onClick={() => window.location.href = '/terms'}>
                Términos · Privacidad · Reembolsos
              </span>
            </p>
          </>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex py-2 pb-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/inicio'}>
          <span className="text-lg">🏠</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Inicio</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/fixture'}>
          <span className="text-lg">📅</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Fixture</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/grupos'}>
          <span className="text-lg">👥</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Grupos</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/mis-jugadas'}>
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Jugadas</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => window.location.href = '/perfil'}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>Perfil</span>
        </div>
      </div>

    </main>
  );
}
