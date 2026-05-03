'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function ComprarJugadaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const grupoId = searchParams.get('grupo');

  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState<'mp' | 'paypal'>('mp');

  useEffect(() => {
    const token = searchParams.get('token');
    const mpStatus = searchParams.get('mp_status') || searchParams.get('status');
    const mpTipo = searchParams.get('tipo');
    const mpUserId = searchParams.get('userId');
    const paymentId = searchParams.get('payment_id');

    if (token) {
      localStorage.setItem('pendingPaypalOrder', token);
      localStorage.setItem('pendingPaypalTipo', 'jugada_mundial');
    }
    if ((mpStatus === 'success' || mpStatus === 'approved') && mpTipo && mpUserId) {
      localStorage.setItem('pendingMpTipo', mpTipo);
      localStorage.setItem('pendingMpUserId', mpUserId);
      if (paymentId) localStorage.setItem('pendingMpPaymentId', paymentId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const paypalOrderId = localStorage.getItem('pendingPaypalOrder');
    const paypalTipo = localStorage.getItem('pendingPaypalTipo');
    if (paypalOrderId && paypalTipo === 'jugada_mundial') {
      localStorage.removeItem('pendingPaypalOrder');
      localStorage.removeItem('pendingPaypalTipo');
      capturarPaypal(paypalOrderId);
      return;
    }
    const mpTipo = localStorage.getItem('pendingMpTipo');
    const mpUserId = localStorage.getItem('pendingMpUserId');
    const mpPaymentId = localStorage.getItem('pendingMpPaymentId');
    if (mpTipo === 'jugada_mundial' && mpUserId) {
      localStorage.removeItem('pendingMpTipo');
      localStorage.removeItem('pendingMpUserId');
      localStorage.removeItem('pendingMpPaymentId');
      capturarMP(mpUserId, mpPaymentId || '');
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

  const capturarPaypal = async (orderId: string) => {
    setProcesando(true);
    try {
      const res = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId: user.uid, tipo: 'jugada_mundial' }),
      });
      const data = await res.json();
      if (data.ok) {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (snap.exists()) setUserData(snap.data());
        router.replace(grupoId ? `/mundial/jugada/crear?grupo=${grupoId}` : '/mundial/jugada/crear');
      } else {
        setError('Error al procesar el pago. Contactá soporte.');
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    }
    setProcesando(false);
  };

  const capturarMP = async (userId: string, paymentId: string) => {
    setProcesando(true);
    try {
      const res = await fetch('/api/mercadopago/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'jugada_mundial', userId, paymentId }),
      });
      const data = await res.json();
      if (data.ok) {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (snap.exists()) setUserData(snap.data());
        router.replace(grupoId ? `/mundial/jugada/crear?grupo=${grupoId}` : '/mundial/jugada/crear');
      } else {
        setError('Error al procesar el pago. Contactá soporte.');
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    }
    setProcesando(false);
  };

  const comprarJugadaPaypal = async () => {
    setProcesando(true);
    setError('');
    try {
      const returnUrl = grupoId
        ? `https://pickgol2026.vercel.app/mundial/comprar-jugada?grupo=${grupoId}`
        : 'https://pickgol2026.vercel.app/mundial/comprar-jugada';
      const res = await fetch('/api/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: '0.99',
          currency: 'USD',
          description: 'PickGol — Jugada extra Mundial 2026',
          returnUrl,
          cancelUrl: returnUrl + '?cancelled=true',
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

  const comprarJugadaMP = async () => {
    setProcesando(true);
    setError('');
    try {
      const returnUrl = grupoId
        ? `https://pickgol2026.vercel.app/mundial/comprar-jugada?grupo=${grupoId}`
        : 'https://pickgol2026.vercel.app/mundial/comprar-jugada';
      const res = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 0.99,
          description: 'PickGol — Jugada extra Mundial 2026',
          returnUrl,
          tipo: 'jugada_mundial',
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

  const comprarJugada = () => {
    if (metodoPago === 'mp') comprarJugadaMP();
    else comprarJugadaPaypal();
  };

  if (loading || procesando) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>
          {procesando ? 'Procesando pago...' : 'Cargando...'}
        </p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-10">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0d0d1a,#1a1a2e,#16213e)', borderBottom: '1px solid rgba(200,170,110,0.2)' }}
        className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(200,170,110,0.1)', color: '#C8AA6E' }}>←</button>
          <span className="text-xs" style={{ color: 'rgba(210,185,130,0.6)' }}>Mundial · <b style={{ color: 'rgba(210,185,130,0.85)' }}>Más jugadas</b></span>
        </div>
        <div className="text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="font-condensed text-3xl font-black mb-1" style={{ color: '#C8AA6E' }}>¿QUERÉS MÁS JUGADAS?</h1>
          <p className="text-sm" style={{ color: 'rgba(210,185,130,0.65)' }}>Elegí la opción que más te convenga</p>
        </div>
      </div>

      <div className="px-4 py-4">

        {/* OPCIÓN A — Jugada extra */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#0D1B3E', border: '1px solid rgba(200,170,110,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-condensed text-xl font-black" style={{ color: '#C8AA6E' }}>Jugada extra</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(210,185,130,0.65)' }}>Una jugada más para el Mundial</div>
            </div>
            <div className="font-condensed text-2xl font-black" style={{ color: '#C8AA6E' }}>USD 0.99</div>
          </div>

          <div className="mb-4">
            <div className="font-condensed text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(210,185,130,0.5)' }}>
              Método de pago
            </div>
            <div className="flex gap-2">
              <div onClick={() => setMetodoPago('mp')}
                className="flex-1 rounded-xl py-3 px-3 cursor-pointer flex items-center justify-center"
                style={{ background: metodoPago === 'mp' ? 'rgba(0,158,227,0.15)' : 'rgba(200,170,110,0.04)', border: metodoPago === 'mp' ? '1px solid rgba(0,158,227,0.5)' : '1px solid rgba(200,170,110,0.15)' }}>
                <span className="text-sm font-black" style={{ color: metodoPago === 'mp' ? '#009EE3' : 'rgba(210,185,130,0.55)' }}>MercadoPago</span>
              </div>
              <div onClick={() => setMetodoPago('paypal')}
                className="flex-1 rounded-xl py-3 px-3 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: metodoPago === 'paypal' ? 'rgba(0,112,186,0.15)' : 'rgba(200,170,110,0.04)', border: metodoPago === 'paypal' ? '1px solid rgba(0,112,186,0.5)' : '1px solid rgba(200,170,110,0.15)' }}>
                <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-4 rounded object-contain" />
                <span className="text-xs font-bold" style={{ color: metodoPago === 'paypal' ? '#009BDE' : 'rgba(210,185,130,0.55)' }}>PayPal</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs mb-3 text-center" style={{ color: '#E8192C' }}>{error}</p>}

          <button onClick={comprarJugada} disabled={procesando}
            className="w-full py-3 rounded-xl font-condensed font-black text-lg"
            style={{ background: '#C8AA6E', color: '#0d0d1a', opacity: procesando ? 0.7 : 1 }}>
            ⚽ COMPRAR JUGADA — USD 0.99
          </button>
        </div>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(200,170,110,0.15)' }} />
          <span className="text-xs font-bold" style={{ color: 'rgba(210,185,130,0.45)' }}>O MEJOR AÚN</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(200,170,110,0.15)' }} />
        </div>

        {/* OPCIÓN B — Plus */}
        <div onClick={() => router.push('/plus')}
          className="rounded-2xl p-5 mb-4 cursor-pointer"
          style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-condensed text-xl font-black flex items-center gap-2" style={{ color: '#C9A84C' }}>
                ⭐ PickGol Plus
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#8892A4' }}>Jugadas ilimitadas + variables personalizadas</div>
            </div>
            <div className="font-condensed text-2xl font-black" style={{ color: '#C9A84C' }}>USD 2.79</div>
          </div>
          <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(201,168,76,0.08)' }}>
            {[
              '⚽ Jugadas ilimitadas en el Mundial',
              '🎯 Variables personalizadas en ligas y Mundial',
              '✏️ Definí el puntaje de cada variable',
              '🔒 Pago único para siempre',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-xs" style={{ color: 'rgba(201,168,76,0.8)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="w-full py-3 rounded-xl font-condensed font-black text-lg text-center"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#8B6914)', color: '#020810' }}>
            ⭐ ACTIVAR PLUS — USD 2.79
          </div>
        </div>

        <button onClick={() => router.back()}
          className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
          style={{ background: 'transparent', border: '1px solid rgba(200,170,110,0.2)', color: 'rgba(210,185,130,0.6)' }}>
          Volver
        </button>

      </div>
    </main>
  );
}

export default function ComprarJugada() {
  return <Suspense><ComprarJugadaContent /></Suspense>;
}