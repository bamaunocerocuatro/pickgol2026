'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useParams } from 'next/navigation';

export default function Chat() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<any>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { window.location.href = '/login'; return; }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, 'grupos', id));
        if (snap.exists()) setGrupo({ id: snap.id, ...snap.data() });
      } catch (e) {}
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!grupo) return;
    const q = query(collection(db, 'grupos', id, 'mensajes'), orderBy('creadoEn', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [grupo, id]);

  const enviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, 'grupos', id, 'mensajes'), {
        texto: texto.trim(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        creadoEn: serverTimestamp(),
      });
      setTexto('');
    } catch (e) {}
    setEnviando(false);
  };

  const formatHora = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-3">💬</div>
        <p className="text-[#8892A4] text-sm">Cargando...</p>
      </div>
    </main>
  );

  if (!grupo) return (
    <main className="min-h-screen bg-[#020810] flex items-center justify-center">
      <p className="text-[#8892A4]">Grupo no encontrado</p>
    </main>
  );

  if (!grupo.chatHabilitado) return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => window.location.href = `/grupo/${id}`}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm"
          >←</button>
          <span className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>← <b style={{color:'rgba(255,255,255,0.65)'}}>{grupo.nombre}</b></span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">Chat 💬</h1>
      </div>
      <div className="px-4 py-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <div className="font-condensed text-xl font-black mb-2">Chat deshabilitado</div>
        <p className="text-xs" style={{color:'#8892A4'}}>El creador del grupo no habilitó el chat todavía.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto flex flex-col" style={{height:'100vh'}}>

      {/* HEADER */}
      <div style={{background:'linear-gradient(160deg,#0A1F5C,#0D2870)'}} className="px-4 pt-4 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = `/grupo/${id}`}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm"
          >←</button>
          <div>
            <div className="font-condensed text-lg font-black">{grupo.nombre}</div>
            <div className="text-xs" style={{color:'#8892A4'}}>💬 Chat del grupo · {grupo.miembros?.length || 1} jugadores</div>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{paddingBottom:'80px'}}>
        {mensajes.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm" style={{color:'#8892A4'}}>No hay mensajes todavía. ¡Empezá la conversación!</p>
          </div>
        )}
        {mensajes.map((m, i) => {
          const esMio = m.userId === user?.uid;
          return (
            <div key={m.id} className={`flex mb-3 ${esMio ? 'justify-end' : 'justify-start'}`}>
              <div style={{maxWidth:'75%'}}>
                {!esMio && (
                  <div className="text-xs mb-1 px-1" style={{color:'#8892A4'}}>{m.userName}</div>
                )}
                <div
                  className="px-3 py-2 rounded-2xl text-sm"
                  style={{
                    background: esMio ? '#E8192C' : '#0D1B3E',
                    color: 'white',
                    borderBottomRightRadius: esMio ? '4px' : '16px',
                    borderBottomLeftRadius: esMio ? '16px' : '4px',
                  }}
                >
                  {m.texto}
                </div>
                <div className={`text-xs mt-1 px-1 ${esMio ? 'text-right' : 'text-left'}`} style={{color:'rgba(255,255,255,0.3)'}}>
                  {formatHora(m.creadoEn)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3" style={{background:'rgba(6,13,31,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            placeholder="Escribí un mensaje..."
            className="flex-1 rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.09)'}}
          />
          <button
            onClick={enviar}
            disabled={enviando || !texto.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
            style={{background:'#E8192C',opacity: enviando || !texto.trim() ? 0.5 : 1}}
          >
            ➤
          </button>
        </div>
      </div>

    </main>
  );
}