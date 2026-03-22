'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useIdioma } from '../context/IdiomaContext';

const NIVELES_REFERIDOS = [
  { referidos: 3, jugadas: 1, campo: 'nivel1' },
  { referidos: 6, jugadas: 2, campo: 'nivel2' },
  { referidos: 10, jugadas: 5, campo: 'nivel3' },
];

const IDIOMAS = [
  { code: 'es', label: '🇦🇷 ES' },
  { code: 'pt', label: '🇧🇷 PT' },
  { code: 'en', label: '🌍 EN' },
];

const TEXTOS_LOGIN: Record<string, any> = {
  es: {
    titulo: 'Jugá, acertá y liderá el ranking ⚽🔥',
    iniciarSesion: 'INICIAR SESIÓN', crearCuenta: 'CREAR CUENTA',
    email: 'Email', password: 'Contraseña', entrar: 'ENTRAR',
    google: 'CONTINUAR CON GOOGLE',
    yaTenes: '¿Ya tenés cuenta?', noTenes: '¿No tenés cuenta?',
    iniciaSesion: 'Iniciá sesión', registrate: 'Registrate',
    invitado: 'Fuiste invitado — vas a recibir beneficios al registrarte',
  },
  pt: {
    titulo: 'Jogue, acerte e lidere o ranking ⚽🔥',
    iniciarSesion: 'ENTRAR', crearCuenta: 'CRIAR CONTA',
    email: 'Email', password: 'Senha', entrar: 'ENTRAR',
    google: 'CONTINUAR COM GOOGLE',
    yaTenes: 'Já tem uma conta?', noTenes: 'Não tem uma conta?',
    iniciaSesion: 'Entrar', registrate: 'Cadastre-se',
    invitado: 'Você foi convidado — vai receber benefícios ao se cadastrar',
  },
  en: {
    titulo: 'Play, predict and lead the ranking ⚽🔥',
    iniciarSesion: 'SIGN IN', crearCuenta: 'CREATE ACCOUNT',
    email: 'Email', password: 'Password', entrar: 'SIGN IN',
    google: 'CONTINUE WITH GOOGLE',
    yaTenes: 'Already have an account?', noTenes: "Don't have an account?",
    iniciaSesion: 'Sign in', registrate: 'Sign up',
    invitado: 'You were invited — you\'ll receive benefits when you sign up',
  },
};

function LoginForm() {
  const router = useRouter();
  const { locale, setLocale } = useIdioma();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');
  const searchParams = useSearchParams();

  const tl = TEXTOS_LOGIN[locale] || TEXTOS_LOGIN.es;

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

  const acreditarJugadasGratis = async (referidorId: string, nuevoTotal: number) => {
    try {
      const snap = await getDoc(doc(db, 'usuarios', referidorId));
      if (!snap.exists()) return;
      const data = snap.data();
      const updates: Record<string, any> = {};
      for (const nivel of NIVELES_REFERIDOS) {
        if (nuevoTotal >= nivel.referidos && !data[nivel.campo]) {
          updates[nivel.campo] = true;
          updates.jugadasGratis = (updates.jugadasGratis ?? (data.jugadasGratis || 0)) + nivel.jugadas;
        }
      }
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'usuarios', referidorId), updates);
      }
    } catch (e) {}
  };

  const procesarReferido = async (uid: string) => {
    const ref = refCode || localStorage.getItem('pickgol_ref');
    if (!ref || ref === generarCodigo(uid)) return;
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'usuarios'), where('codigoRef', '==', ref));
      const snap = await getDocs(q);
      if (snap.empty) return;
      const referidorDoc = snap.docs[0];
      const referidorId = referidorDoc.id;
      const totalActual = referidorDoc.data().totalReferidos || 0;
      const nuevoTotal = totalActual + 1;
      await setDoc(doc(db, 'referidos', uid), {
        referidoPor: referidorId,
        codigoUsado: ref,
        creadoEn: serverTimestamp(),
      });
      await updateDoc(doc(db, 'usuarios', referidorId), {
        totalReferidos: increment(1),
      });
      await acreditarJugadasGratis(referidorId, nuevoTotal);
      localStorage.removeItem('pickgol_ref');
    } catch (e) {}
  };

  const crearUsuario = async (uid: string, email: string, displayName?: string) => {
    const codigo = generarCodigo(uid);
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid, email,
        displayName: displayName || '',
        codigoRef: codigo,
        totalReferidos: 0,
        jugadasGratis: 0,
        nivel1: false, nivel2: false, nivel3: false,
        idioma: locale,
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
      router.push('/inicio');
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
      router.push('/inicio');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">

        {/* SELECTOR IDIOMA */}
        <div className="flex justify-center gap-2 mb-6">
          {IDIOMAS.map(i => (
            <div key={i.code} onClick={() => setLocale(i.code)}
              className="px-3 py-1 rounded-lg cursor-pointer text-xs font-bold"
              style={{
                background: locale === i.code ? 'rgba(232,25,44,0.2)' : 'rgba(255,255,255,0.05)',
                border: locale === i.code ? '1px solid #E8192C' : '1px solid rgba(255,255,255,0.1)',
                color: locale === i.code ? '#F5F5F0' : '#8892A4'
              }}>
              {i.label}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="font-condensed text-5xl font-black text-[#C9A84C] mb-1">PickGol</h1>
          <p className="font-condensed text-2xl font-bold text-white">2026 ⚽</p>
          <p className="text-[#8892A4] text-sm mt-2">{tl.titulo}</p>
        </div>

        {refCode && (
          <div className="mb-4 rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{background:'rgba(0,200,83,0.1)',border:'1px solid rgba(0,200,83,0.3)',color:'#00C853'}}>
            🎁 {tl.invitado}
          </div>
        )}

        <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl p-6">
          <h2 className="font-condensed text-xl font-bold mb-5">
            {isRegister ? tl.crearCuenta : tl.iniciarSesion}
          </h2>

          <div className="mb-4">
            <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider block mb-2">{tl.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none"
              placeholder="tu@email.com" />
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-[#8892A4] uppercase tracking-wider block mb-2">{tl.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none"
              placeholder="••••••••" />
          </div>

          {error && <p className="text-[#E8192C] text-xs mb-4">{error}</p>}

          <button onClick={handleEmail}
            className="w-full bg-[#E8192C] text-white font-condensed font-black text-lg py-3 rounded-xl mb-3 tracking-wide">
            {isRegister ? tl.crearCuenta : tl.entrar}
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-[#8892A4]">o</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button onClick={handleGoogle}
            className="w-full bg-white/5 border border-white/10 text-white font-condensed font-bold text-base py-3 rounded-xl mb-4">
            🔵 {tl.google}
          </button>

          <p className="text-center text-xs text-[#8892A4]">
            {isRegister ? tl.yaTenes : tl.noTenes}{' '}
            <span onClick={() => setIsRegister(!isRegister)} className="text-[#C9A84C] cursor-pointer font-semibold">
              {isRegister ? tl.iniciaSesion : tl.registrate}
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
