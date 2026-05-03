'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useIdioma } from '../context/IdiomaContext';

export default function Onboarding() {
  const router = useRouter();
  const { locale } = useIdioma();
  const [user, setUser] = useState<any>(null);
  const [paso, setPaso] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
    });
    return () => unsub();
  }, []);

  const terminar = async () => {
    if (saliendo) return;
    setSaliendo(true);
    try {
      if (user) {
        await updateDoc(doc(db, 'usuarios', user.uid), { onboardingVisto: true });
      }
    } catch (e) {}
    router.push('/inicio');
  };

  const textos: Record<string, any> = {
    es: {
      saltar: 'Saltar',
      siguiente: 'SIGUIENTE →',
      empezar: '⚽ EMPEZAR A JUGAR',
      pasos: [
        {
          emoji: '⚽',
          titulo: 'Bienvenido a PickGol',
          subtitulo: 'La forma más divertida de predecir fútbol',
          descripcion: 'Predecí resultados, acumulá puntos y competí con tus amigos en ligas y el Mundial 2026.',
        },
        {
          emoji: null,
          titulo: '¿Cómo funciona?',
          subtitulo: 'Tres pasos simples',
          items: [
            { emoji: '🎯', titulo: 'Creá tu jugada', desc: 'Predecí resultados de partidos y variables de la fecha' },
            { emoji: '👥', titulo: 'Jugá en grupo', desc: 'Invitá amigos con un código único y competí entre ustedes' },
            { emoji: '🏆', titulo: 'Ganá puntos', desc: 'El más acertado lidera el ranking del grupo' },
          ],
        },
        {
          emoji: '🏆',
          titulo: 'Mundial 2026',
          subtitulo: 'USA · Canadá · México',
          descripcion: '1 jugada gratis para toda la fase de grupos. Predecís las 72 partidos y variables globales del torneo.',
          tag: '🎁 1 jugada gratis incluida',
        },
      ],
    },
    pt: {
      saltar: 'Pular',
      siguiente: 'PRÓXIMO →',
      empezar: '⚽ COMEÇAR A JOGAR',
      pasos: [
        {
          emoji: '⚽',
          titulo: 'Bem-vindo ao PickGol',
          subtitulo: 'A forma mais divertida de prever futebol',
          descripcion: 'Preveja resultados, acumule pontos e compita com amigos em ligas e na Copa do Mundo 2026.',
        },
        {
          emoji: null,
          titulo: 'Como funciona?',
          subtitulo: 'Três passos simples',
          items: [
            { emoji: '🎯', titulo: 'Crie sua aposta', desc: 'Preveja resultados de jogos e variáveis da rodada' },
            { emoji: '👥', titulo: 'Jogue em grupo', desc: 'Convide amigos com um código único e compita entre vocês' },
            { emoji: '🏆', titulo: 'Ganhe pontos', desc: 'Quem acertar mais lidera o ranking do grupo' },
          ],
        },
        {
          emoji: '🏆',
          titulo: 'Copa do Mundo 2026',
          subtitulo: 'EUA · Canadá · México',
          descripcion: '1 aposta grátis para toda a fase de grupos. Você prevê os 72 jogos e variáveis globais do torneio.',
          tag: '🎁 1 aposta grátis incluída',
        },
      ],
    },
    en: {
      saltar: 'Skip',
      siguiente: 'NEXT →',
      empezar: '⚽ START PLAYING',
      pasos: [
        {
          emoji: '⚽',
          titulo: 'Welcome to PickGol',
          subtitulo: 'The most fun way to predict football',
          descripcion: 'Predict results, earn points and compete with friends in leagues and the 2026 World Cup.',
        },
        {
          emoji: null,
          titulo: 'How does it work?',
          subtitulo: 'Three simple steps',
          items: [
            { emoji: '🎯', titulo: 'Create your prediction', desc: 'Predict match results and matchday variables' },
            { emoji: '👥', titulo: 'Play in a group', desc: 'Invite friends with a unique code and compete together' },
            { emoji: '🏆', titulo: 'Earn points', desc: 'The most accurate player leads the group ranking' },
          ],
        },
        {
          emoji: '🏆',
          titulo: 'World Cup 2026',
          subtitulo: 'USA · Canada · Mexico',
          descripcion: '1 free prediction for the entire group stage. Predict all 72 matches and global tournament variables.',
          tag: '🎁 1 free prediction included',
        },
      ],
    },
  };

  const t = textos[locale] || textos.es;
  const pasoActual = t.pasos[paso];
  const esMundial = paso === 2;

  return (
    <main className="min-h-screen max-w-md mx-auto flex flex-col"
      style={{ background: esMundial ? '#020810' : '#020810' }}>

      {/* HEADER */}
      <div className="flex justify-between items-center px-6 pt-6 pb-2">
        <div className="font-condensed text-xl font-black" style={{ color: esMundial ? '#C8AA6E' : '#E8192C' }}>
          PICKGOL
        </div>
        {paso < 2 && (
          <button onClick={terminar} className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ color: '#8892A4', background: 'rgba(255,255,255,0.05)' }}>
            {t.saltar}
          </button>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* PASO 1 — Bienvenida */}
        {paso === 0 && (
          <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce">⚽</div>
            <h1 className="font-condensed text-4xl font-black mb-3" style={{ color: '#F5F5F0' }}>
              {pasoActual.titulo}
            </h1>
            <p className="text-base font-semibold mb-4" style={{ color: '#E8192C' }}>
              {pasoActual.subtitulo}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#8892A4' }}>
              {pasoActual.descripcion}
            </p>
          </div>
        )}

        {/* PASO 2 — Cómo funciona */}
        {paso === 1 && (
          <div className="w-full">
            <h1 className="font-condensed text-3xl font-black mb-2 text-center" style={{ color: '#F5F5F0' }}>
              {pasoActual.titulo}
            </h1>
            <p className="text-sm text-center mb-8" style={{ color: '#8892A4' }}>
              {pasoActual.subtitulo}
            </p>
            <div className="flex flex-col gap-4">
              {pasoActual.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-4xl flex-shrink-0">{item.emoji}</div>
                  <div>
                    <div className="font-condensed text-lg font-black mb-1" style={{ color: '#F5F5F0' }}>
                      {item.titulo}
                    </div>
                    <div className="text-xs" style={{ color: '#8892A4' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3 — Mundial */}
        {paso === 2 && (
          <div className="text-center w-full">
            <div className="inline-block px-3 py-1 rounded-full mb-4 text-xs font-bold"
              style={{ background: 'rgba(200,170,110,0.12)', color: '#C8AA6E', border: '1px solid rgba(200,170,110,0.25)' }}>
              FIFA WORLD CUP 2026
            </div>
            <div className="text-7xl mb-4">🏆</div>
            <h1 className="font-condensed text-4xl font-black mb-2" style={{ color: '#C8AA6E' }}>
              {pasoActual.titulo}
            </h1>
            <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(210,185,130,0.65)' }}>
              {pasoActual.subtitulo}
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(210,185,130,0.75)' }}>
              {pasoActual.descripcion}
            </p>
            <div className="rounded-2xl px-4 py-3 inline-block"
              style={{ background: 'rgba(200,170,110,0.1)', border: '1px solid rgba(200,170,110,0.25)' }}>
              <span className="font-condensed text-base font-black" style={{ color: '#C8AA6E' }}>
                {pasoActual.tag}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 pb-10">

        {/* PUNTOS */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-full transition-all"
              style={{
                width: paso === i ? '24px' : '8px',
                height: '8px',
                background: paso === i ? (esMundial ? '#C8AA6E' : '#E8192C') : 'rgba(255,255,255,0.15)',
              }} />
          ))}
        </div>

        {/* BOTÓN */}
        {paso < 2 ? (
          <button onClick={() => setPaso(paso + 1)}
            className="w-full py-4 rounded-2xl font-condensed font-black text-lg"
            style={{ background: '#E8192C', color: 'white' }}>
            {t.siguiente}
          </button>
        ) : (
          <button onClick={terminar} disabled={saliendo}
            className="w-full py-4 rounded-2xl font-condensed font-black text-lg"
            style={{ background: '#C8AA6E', color: '#0d0d1a', opacity: saliendo ? 0.7 : 1 }}>
            {saliendo ? '...' : t.empezar}
          </button>
        )}
      </div>

    </main>
  );
}