'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useIdioma } from '../context/IdiomaContext';

export default function Unirse() {
  const router = useRouter();
  const { t } = useIdioma();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [grupo, setGrupo] = useState<any>(null);
  const [uniendose, setUniendose] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const codigoParam = params.get('codigo');
    if (codigoParam) {
      setCodigo(codigoParam.toUpperCase());
      buscarGrupoConCodigo(codigoParam.toUpperCase());
    }
  }, [user]);

  const buscarGrupoConCodigo = async (cod: string) => {
    setError('');
    setGrupo(null);
    setBuscando(true);
    try {
      const q = query(collection(db, 'grupos'), where('codigo', '==', cod));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError(t.codigoIncorrecto);
      } else {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setGrupo(data);
        if ((data as any).precio) setShowAlerta(true);
      }
    } catch (e) {
      setError(t.errorBuscar);
    }
    setBuscando(false);
  };

  const buscarGrupo = async () => {
    if (!codigo.trim()) { setError(t.ingresaCodigo); return; }
    await buscarGrupoConCodigo(codigo.trim().toUpperCase());
  };

  const unirse = async () => {
    setShowAlerta(false);
    setUniendose(true);
    try {
      await updateDoc(doc(db, 'grupos', grupo.id), { miembros: arrayUnion(user.uid) });
      router.push(`/grupo/${grupo.id}`);
    } catch (e) {
      setError(t.errorUnirse);
    }
    setUniendose(false);
  };

  const LIGAS: Record<string, string> = {
    premier: 'Premier League', laliga: 'La Liga', seriea: 'Serie A',
    bundesliga: 'Bundesliga', ligue1: 'Ligue 1', ligapro: 'Liga Profesional',
    brasileirao: 'Brasileirão',
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3">⚽</div><p className="text-[#8892A4] text-sm">Cargando...</p></div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>{t.unirseGrupo}</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">{t.unirseGrupo}</h1>
        <p className="text-xs" style={{color:'#8892A4'}}>{t.unirseDesc}</p>
      </div>

      <div className="px-4 py-4">
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{color:'#8892A4'}}>{t.codigoGrupo}</label>
          <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej: AB12CD" maxLength={6}
            className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none text-center font-condensed font-black text-2xl tracking-widest"
            style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.09)'}} />
        </div>

        {error && <p className="text-xs mb-4" style={{color:'#E8192C'}}>{error}</p>}

        <button onClick={buscarGrupo} disabled={buscando}
          className="w-full py-3 rounded-xl font-condensed font-black text-lg mb-4"
          style={{background:'#E8192C',color:'white',opacity: buscando ? 0.7 : 1}}>
          {buscando ? t.buscando : t.buscarGrupo}
        </button>

        {grupo && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#0D1B3E',border:'1px solid rgba(0,200,83,0.25)'}}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl">👥</div>
                <div>
                  <div className="font-condensed text-lg font-black">{grupo.nombre}</div>
                  <div className="text-xs" style={{color:'#8892A4'}}>{LIGAS[grupo.liga] || grupo.liga} · {grupo.tipo === 'temporada' ? t.todaLaTemporada : t.fechasEsp}</div>
                </div>
              </div>
              {grupo.precio && (
                <div className="rounded-xl p-3 mb-3 flex gap-2" style={{background:'rgba(255,179,0,0.07)',border:'1px solid rgba(255,179,0,0.2)'}}>
                  <span>💰</span>
                  <p className="text-xs" style={{color:'rgba(255,255,255,0.6)'}}>
                    {t.grupoCostoDesc} <b style={{color:'white'}}>{grupo.moneda} {grupo.precio}</b> {t.grupoCostoDesc2}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xs" style={{color:'#8892A4'}}>
                  👥 {grupo.miembros?.length || 1} {grupo.miembros?.length !== 1 ? t.miembros : t.miembro}
                </div>
              </div>
              <button onClick={() => grupo.precio ? setShowAlerta(true) : unirse()} disabled={uniendose}
                className="w-full py-3 rounded-xl font-condensed font-black text-base"
                style={{background:'#00C853',color:'white',opacity: uniendose ? 0.7 : 1}}>
                {uniendose ? t.uniendose : t.unirmeBtn}
              </button>
            </div>
          </div>
        )}
      </div>

      {showAlerta && grupo && (
        <div className="fixed inset-0 flex items-center justify-center px-5"
          style={{background:'rgba(0,0,0,0.75)',zIndex:999}}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{background:'#0D1B3E'}}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">💰</div>
              <div className="font-condensed text-xl font-black mb-2">{t.grupoCosto}</div>
              <p className="text-xs" style={{color:'#8892A4',lineHeight:'1.6'}}>
                {t.grupoCostoDesc} <b style={{color:'white'}}>{grupo.moneda} {grupo.precio}</b> {t.grupoCostoDesc2}
              </p>
            </div>
            <button onClick={unirse}
              className="w-full py-3 rounded-xl font-condensed font-black text-base mb-2"
              style={{background:'#E8192C',color:'white'}}>
              {t.siUnirme}
            </button>
            <button onClick={() => setShowAlerta(false)}
              className="w-full py-3 rounded-xl font-condensed font-bold text-sm"
              style={{background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'#F5F5F0'}}>
              {t.cancelar}
            </button>
          </div>
        </div>
      )}

    </main>
  );
}