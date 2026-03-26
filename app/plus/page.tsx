'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useIdioma } from '../context/IdiomaContext';

function PlusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useIdioma();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'paypal' | 'mp'>('mp');

  useEffect(() => {
    const orderId = searchParams.get('token');
    if (orderId) {
      localStorage.setItem('pendingPaypalOrder', orderId);
      localStorage.setItem('pendingPaypalTipo', 'plus');
    }
    const mpStatus = searchParams.get('mp_status');
    const mpTipo = searchParams.get('tipo');
    const mpUserId = searchParams.get('userId');
    if (mpStatus === 'success' && mpTipo && mpUserId) {
      localStorage.setItem('pendingMpTipo', mpTipo);
      localStorage.setItem('pendingMpUserId', mpUserId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const paypalOrderId = localStorage.getItem('pendingPaypalOrder');
    const paypalTipo = localStorage.getItem('pendingPaypalTipo');
    if (paypalOrderId && paypalTipo) {
      localStorage.removeItem('pendingPaypalOrder');
      localStorage.removeItem('pendingPaypalTipo');
      capturarPaypal(paypalOrderId, paypalTipo);
      return;
    }
    const mpTipo = localStorage.getItem('pendingMpTipo');
    const mpUserId = localStorage.getItem('pendingMpUserId');
    if (mpTipo && mpUserId) {
      localStorage.removeItem('pendingMpTipo');
      localStorage.removeItem('pendingMpUserId');
      capturarMP(mpTipo, mpUserId);
      return;
    }
  }, [user]);

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
    return () => unsub();
  }, []);

  const capturarPaypal = async (orderId: string, tipo: string) => {
    setProcesando(true);
    try {
      const res = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId: user.uid, tipo }),
      });
      const data = await res.json();
      if (data.ok) {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (snap.exists()) setUserData(snap.data());
        router.replace('/plus');
      } else {
        setError('Error al procesar el pago. Contactá soporte.');
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    }
    setProcesando(false);
  };

  const capturarMP = async (tipo: string, userId: string) => {
    setProcesando(true);
    try {
      const res = await fetch('/api/mercadopago/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, userId }),
      });
      const data = await res.json();
      if (data.ok) {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (snap.exists()) setUserData(snap.data());
        router.replace('/plus');
      } else {
        setError('Error al procesar el pago. Contactá soporte.');
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    }
    setProcesando(false);
  };

  const handleComprarPaypal = async () => {
    if (!user) return;
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '2.79',
          currency: 'USD',
          description: 'PickGol Plus — Variables personalizadas (pago único)',
          returnUrl: 'https://pickgol2026.vercel.app/plus',
          cancelUrl: 'https://pickgol2026.vercel.app/plus?cancelled=true',
        }),
      });
      const data = await res.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        setError('Error al iniciar el pago. Intentá de nuevo.');
        setProcesando(false);
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
      setProcesando(false);
    }
  };

  const handleComprarMP = async () => {
    if (!user) return;
    setProcesando(true);
    setError('');
    try {
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 2.79,
          description: 'PickGol Plus — Variables personalizadas (pago único)',
          returnUrl: 'https://pickgol2026.vercel.app/plus',
          tipo: 'plus',
          userId: user.uid,
        }),
      });
      const data = await res.json();
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        setError('Error al iniciar el pago. Intentá de nuevo.');
        setProcesando(false);
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
      setProcesando(false);
    }
  };

  const handleComprar = () => {
    if (metodoPago === 'mp') handleComprarMP();
    else handleComprarPaypal();
  };

  if (loading || procesando) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">⭐</div>
        <p className="text-[#8892A4] text-sm">{procesando ? 'Procesando pago...' : 'Cargando...'}</p>
      </div>
    </main>
  );

  const yaEsPlus = userData?.plus === true;

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>PickGol Plus</span>
        </div>
        <div className="text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="font-condensed text-4xl font-black mb-1" style={{color:'#C9A84C'}}>{t.plus}</h1>
          <p className="text-sm" style={{color:'#8892A4'}}>{t.plusSub}</p>
        </div>
      </div>

      <div className="px-4 py-4">

        {yaEsPlus ? (
          <div className="rounded-2xl p-6 text-center mb-4" style={{background:'rgba(0,200,83,0.1)',border:'1px solid rgba(0,200,83,0.3)'}}>
            <div className="text-4xl mb-3">✅</div>
            <div className="font-condensed text-2xl font-black mb-1" style={{color:'#00C853'}}>{t.yaEsPlus}</div>
            <p className="text-sm" style={{color:'#8892A4'}}>{t.yaEsPlusSub}</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-5 mb-4 text-center" style={{background:'#0D1B3E',border:'1px solid rgba(201,168,76,0.3)'}}>
              <div className="font-condensed text-5xl font-black mb-1" style={{color:'#C9A84C'}}>USD 2.79</div>
              <div className="text-sm" style={{color:'#8892A4'}}>Pago único · Para siempre</div>
            </div>

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

            {/* SELECTOR MÉTODO DE PAGO */}
            <div className="mb-4">
              <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{color:'#8892A4'}}>
                Método de pago
              </div>
              <div className="flex gap-2">
                <div onClick={() => setMetodoPago('mp')}
                  className="flex-1 rounded-xl py-3 px-3 cursor-pointer flex items-center justify-center"
                  style={{background: metodoPago === 'mp' ? 'rgba(0,158,227,0.15)' : 'rgba(0,0,0,0.35)', border: metodoPago === 'mp' ? '1px solid rgba(0,158,227,0.5)' : '1px solid rgba(255,255,255,0.09)'}}>
                  <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png" alt="MercadoPago" className="h-4 object-contain" />
                </div>
                <div onClick={() => setMetodoPago('paypal')}
                  className="flex-1 rounded-xl py-3 px-3 cursor-pointer flex items-center justify-center gap-2"
                  style={{background: metodoPago === 'paypal' ? 'rgba(0,112,186,0.15)' : 'rgba(0,0,0,0.35)', border: metodoPago === 'paypal' ? '1px solid rgba(0,112,186,0.5)' : '1px solid rgba(255,255,255,0.09)'}}>
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-4 rounded object-contain" />
                  <span className="text-xs font-bold" style={{color: metodoPago === 'paypal' ? '#009BDE' : '#8892A4'}}>PayPal</span>
                </div>
              </div>
            </div>

            {error && <p className="text-xs mb-4 text-center" style={{color:'#E8192C'}}>{error}</p>}

            <button onClick={() => setShowModal(true)} disabled={procesando}
              className="w-full py-4 rounded-xl font-condensed font-black text-xl mb-3"
              style={{background:'linear-gradient(135deg,#C9A84C,#8B6914)',color:'#020810',opacity: procesando ? 0.7 : 1}}>
              ⭐ {t.activarPlus} — USD 2.79
            </button>

            <p className="text-center text-xs" style={{color:'#8892A4'}}>
              <span className="cursor-pointer underline" onClick={() => router.push('/terms')}>
                {t.terminos}
              </span>
            </p>
          </>
        )}

      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center px-5"
          style={{background:'rgba(0,0,0,0.85)',zIndex:999}}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{background:'#0D1B3E',border:'1px solid rgba(201,168,76,0.3)'}}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⭐</div>
              <div className="font-condensed text-xl font-black mb-2" style={{color:'#C9A84C'}}>Antes de activar Plus</div>
              <p className="text-xs" style={{color:'#8892A4',lineHeight:'1.7'}}>
                Las ventajas de PickGol Plus aplican a los <b style={{color:'white'}}>grupos que crees a partir de ahora</b>. Los grupos que ya tenés creados no se modifican y seguirán con las variables estándar.
              </p>
            </div>

            <div className="rounded-xl p-3 mb-4 flex items-start gap-3 cursor-pointer"
              style={{background:'rgba(255,255,255,0.04)',border: acepto ? '1px solid rgba(0,200,83,0.4)' : '1px solid rgba(255,255,255,0.09)'}}
              onClick={() => setAcepto(!acepto)}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{background: acepto ? '#00C853' : 'transparent', border: acepto ? 'none' : '1px solid rgba(255,255,255,0.3)'}}>
                {acepto && <span className="text-xs text-black font-black">✓</span>}
              </div>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>
                Entiendo que las variables personalizadas aplican a los nuevos grupos que cree siendo Plus.
              </p>
            </div>

            <button onClick={() => { if (acepto) { setShowModal(false); handleComprar(); } }}
              disabled={!acepto}
              className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-2"
              style={{background: acepto ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(255,255,255,0.1)', color: acepto ? '#020810' : '#8892A4'}}>
              ⭐ ACTIVAR PLUS — USD 2.79
            </button>
            <button onClick={() => { setShowModal(false); setAcepto(false); }}
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
          <span className="text-lg">🎯</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.jugadas}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/perfil')}>
          <span className="text-lg">👤</span><span className="text-xs font-semibold" style={{color:'#8892A4'}}>{t.perfil}</span>
        </div>
      </div>

    </main>
  );
}

export default function Plus() {
  return <Suspense><PlusContent /></Suspense>;
}
