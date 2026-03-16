 'use client';

import { useState } from 'react';

const LIGAS = [
  { id: 'bundesliga', nombre: 'Bundesliga', pais: 'Alemania', bandera: '/flags/ger.png' },
  { id: 'ligapro', nombre: 'Liga Profesional', pais: 'Argentina', bandera: '/flags/arg.png' },
  { id: 'primera-b', nombre: 'Primera B Nacional', pais: 'Argentina', bandera: '/flags/arg.png' },
  { id: 'brasileirao', nombre: 'Brasileirão', pais: 'Brasil', bandera: '/flags/bra.png' },
  { id: 'laliga', nombre: 'La Liga', pais: 'España', bandera: '/flags/esp.png' },
  { id: 'ligue1', nombre: 'Ligue 1', pais: 'Francia', bandera: '/flags/fra.png' },
  { id: 'premier', nombre: 'Premier League', pais: 'Inglaterra', bandera: '/flags/eng.png' },
  { id: 'seriea', nombre: 'Serie A', pais: 'Italia', bandera: '/flags/ita.png' },
];

interface Props {
  value: string;
  onChange: (id: string) => void;
  showMundial?: boolean;
}

export default function LigaSelector({ value, onChange, showMundial = true }: Props) {
  const [open, setOpen] = useState(false);
  const selected = LIGAS.find(l => l.id === value);

  return (
    <div className="relative">
      {/* TRIGGER */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer"
        style={{background:'rgba(0,0,0,0.35)',border:`1px solid ${open ? 'rgba(232,25,44,0.5)' : 'rgba(255,255,255,0.09)'}`}}
      >
        {selected ? (
          <>
            <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0">
              <img src={selected.bandera} alt={selected.pais} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{selected.nombre}</div>
              <div className="text-xs" style={{color:'#8892A4'}}>{selected.pais}</div>
            </div>
          </>
        ) : (
          <div className="flex-1 text-sm" style={{color:'#8892A4'}}>— Elegí una liga —</div>
        )}
        <div className="text-xs" style={{color:'#8892A4'}}>{open ? '▲' : '▼'}</div>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div
          className="absolute left-0 right-0 rounded-xl overflow-hidden z-50 mt-1"
          style={{background:'#0D1B3E',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}
        >
          {LIGAS.map((liga, i) => (
            <div
              key={liga.id}
              onClick={() => { onChange(liga.id); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              style={{
                borderBottom: i < LIGAS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                background: value === liga.id ? 'rgba(232,25,44,0.1)' : 'transparent'
              }}
            >
              <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0">
                <img src={liga.bandera} alt={liga.pais} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{liga.nombre}</div>
                <div className="text-xs" style={{color:'#8892A4'}}>{liga.pais}</div>
              </div>
              {value === liga.id && <span style={{color:'#E8192C'}}>✓</span>}
            </div>
          ))}

          {showMundial && (
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{background:'rgba(232,25,44,0.05)',borderTop:'1px solid rgba(255,255,255,0.05)',opacity:0.5}}
            >
              <div className="text-xl">🏆</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Mundial 2026</div>
                <div className="text-xs" style={{color:'#8892A4'}}>Disponible el 1 Abr 2026</div>
              </div>
              <span className="text-xs" style={{color:'#E8192C'}}>Próximo</span>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY para cerrar */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
