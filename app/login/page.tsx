'use client';

import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRefCode(ref);
      localStorage.setItem('pickgol_ref', ref);
    } else {
      const saved = localStorage.getItem('pickgol_ref');
      if (saved) setRefCode(saved);
    }
  }, []);

  const generarCodigo = (uid: string) => uid.substring(0, 8).toUpperCase();

  const procesarReferido = async (uid: string) => {
    const ref = refCode || localStorage.getItem('pickgol_ref');
    if (!ref || ref === generarCodigo(uid)) return;

    try {
      // Buscar quién tiene ese código
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'usuarios'), where('codigoRef', '==', ref));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const referidorDoc = snap.docs[0];
      const referidorId = referidorDoc.id;

      // Registrar referido
      await setDoc(doc(db, 'referidos', uid), {
        referidoPor: referidorId,
        codigoUsado: ref,
        creadoEn: serverTimestamp(),
      });

      // Sumar +1 al referidor
      await updateDoc(doc(db, 'usuarios', referidorId), {
        totalReferidos: increment(1),
      });

      localStorage.removeItem('pickgol_ref');
    } catch (e) {}
  };

  const crearUsuario = async (uid: string, email: string, displayName?: string) => {
    const codigo = generarCodigo(uid);
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email,
        displayName: displayName || '',
        codigoRef: codigo,
        totalReferidos: 0,
        jugadasGratis: 0,
        creadoEn: serverTimestamp(),
      });
      await procesarReferido(uid);
    }
  };

  const handleEmail = async () => {
    setError('');
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await crearUsuario(cred.user.uid, email);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      window.location.href = '/inicio';
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await crearUsuario(cred.user.uid, cred.user.email || '', cred.user.displayName || '');
      window.location.href = '/inicio';
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-condensed text-5xl font-black text-[#C9A84C] mb-1">PickGol</h1>
          <p className="font-condensed text-2xl font-bold text-white">2026 ⚽</p>
          <p className="text-[#8892A4] text-sm mt-2">El prode del mundial</p>
        </div>

        {refCode && (
          <div className="mb-4 rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{background:'rgba(0,200,83,0.1)',border:'1px solid rgba(0,200,83,0.3)',color:'#00C853'}}>
            🎁 Fuiste invitado — vas a recibir beneficios al registrarte
          </div>
        )}

        <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl p-6">
          <h2 className="font-condensed text-xl font-bold mb-5">
            {isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
          </h2>

          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider block mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E8192C]/50"
              placeholder="tu@email.com" />
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider block mb-2">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E8192C]/50"
              placeholder="••••••••" />
          </div>

          {error && <p className="text-[#E8192C] text-xs mb-4">{error}</p>}

          <button onClick={handleEmail}
            className="w-full bg-[#E8192C] text-white font-condensed font-black text-lg py-3 rounded-xl mb-3 tracking-wide">
            {isRegister ? 'CREAR CUENTA' : 'ENTRAR'}
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-[#8892A4]">o</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button onClick={handleGoogle}
            className="w-full bg-white/5 border border-white/10 text-white font-condensed font-bold text-base py-3 rounded-xl mb-4">
            🔵 CONTINUAR CON GOOGLE
          </button>

          <p className="text-center text-xs text-[#8892A4]">
            {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
            <span onClick={() => setIsRegister(!isRegister)} className="text-[#C9A84C] cursor-pointer font-semibold">
              {isRegister ? 'Iniciá sesión' : 'Registrate'}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}