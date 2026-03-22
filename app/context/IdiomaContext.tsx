 'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const TEXTOS: Record<string, any> = {
  es: {
    bienvenido: 'Bienvenido de nuevo,', misPts: 'Mis pts', posicion: 'Posición', referidos: 'REFERIDOS',
    mundialTitulo: 'PRODE MUNDIAL 2026', mundialSub: 'Lanzamiento: 1 May 2026 · El más completo',
    crearGrupo: 'CREAR GRUPO', crearGrupoSub: 'Jugá con tus amigos · Elegí la liga',
    prodeComunitario: 'PRODE COMUNITARIO', prodeComunitarioSub: 'Todos contra todos · Elegí la liga',
    ligasDisponibles: 'Ligas disponibles', proximamente: 'Próximamente',
    descargar: 'DESCARGAR PICKGOL', descargarSub: 'Instalá la app en tu celular · Gratis',
    inicio: 'Inicio', fixture: 'Fixture', grupos: 'Grupos', jugadas: 'Jugadas', perfil: 'Perfil',
    invitarAmigos: 'Invitar amigos', referidosSub: 'Invitá amigos y ganá jugadas gratis para el Mundial',
    totalReferidos: 'Referidos', jugadasGratis: 'Jugadas gratis', proximoNivel: 'Próximo nivel',
    tuLink: 'Tu link de invitación', copiar: 'Copiar', invitar: 'INVITAR AMIGOS', recompensas: 'Recompensas',
    ganado: '¡Ganado!', faltan: 'Faltán', paraGanar: 'referidos para ganar',
    miPerfil: 'Mi Perfil', nombreUsuario: 'Nombre de usuario', editar: 'Editar',
    guardar: 'GUARDAR', cancelar: 'CANCELAR', idioma: 'Idioma', infoCuenta: 'Información de cuenta',
    cerrarSesion: 'CERRAR SESIÓN', sinNombre: 'Sin nombre configurado',
    plus: 'PICKGOL PLUS', plusSub: 'Personalizá tu experiencia al máximo',
    activarPlus: 'ACTIVAR PLUS — USD 2.59', yaEsPlus: '¡Ya sos Plus!',
    yaEsPlusSub: 'Tenés acceso a todas las funciones premium',
    procesado: 'Procesado por Paddle · Pago seguro',
    terminos: 'Términos · Privacidad · Reembolsos',
  },
  pt: {
    bienvenido: 'Bem-vindo de volta,', misPts: 'Meus pts', posicion: 'Posição', referidos: 'INDICADOS',
    mundialTitulo: 'PRODE COPA DO MUNDO 2026', mundialSub: 'Lançamento: 1 Mai 2026 · O mais completo',
    crearGrupo: 'CRIAR GRUPO', crearGrupoSub: 'Jogue com seus amigos · Escolha a liga',
    prodeComunitario: 'PRODE COMUNITÁRIO', prodeComunitarioSub: 'Todos contra todos · Escolha a liga',
    ligasDisponibles: 'Ligas disponíveis', proximamente: 'Em breve',
    descargar: 'BAIXAR PICKGOL', descargarSub: 'Instale o app no seu celular · Grátis',
    inicio: 'Início', fixture: 'Jogos', grupos: 'Grupos', jugadas: 'Apostas', perfil: 'Perfil',
    invitarAmigos: 'Convidar amigos', referidosSub: 'Indique amigos e ganhe apostas grátis para a Copa',
    totalReferidos: 'Indicados', jugadasGratis: 'Apostas grátis', proximoNivel: 'Próximo nível',
    tuLink: 'Seu link de convite', copiar: 'Copiar', invitar: 'CONVIDAR AMIGOS', recompensas: 'Recompensas',
    ganado: 'Conquistado!', faltan: 'Faltam', paraGanar: 'indicados para ganhar',
    miPerfil: 'Meu Perfil', nombreUsuario: 'Nome de usuário', editar: 'Editar',
    guardar: 'SALVAR', cancelar: 'CANCELAR', idioma: 'Idioma', infoCuenta: 'Informações da conta',
    cerrarSesion: 'SAIR', sinNombre: 'Sem nome configurado',
    plus: 'PICKGOL PLUS', plusSub: 'Personalize sua experiência ao máximo',
    activarPlus: 'ATIVAR PLUS — USD 2.59', yaEsPlus: 'Você já é Plus!',
    yaEsPlusSub: 'Você tem acesso a todas as funções premium',
    procesado: 'Processado por Paddle · Pagamento seguro',
    terminos: 'Termos · Privacidade · Reembolsos',
  },
  en: {
    bienvenido: 'Welcome back,', misPts: 'My pts', posicion: 'Position', referidos: 'REFERRALS',
    mundialTitulo: 'WORLD CUP 2026 PREDICTIONS', mundialSub: 'Launch: May 1, 2026 · The most complete',
    crearGrupo: 'CREATE GROUP', crearGrupoSub: 'Play with your friends · Choose a league',
    prodeComunitario: 'COMMUNITY PREDICTIONS', prodeComunitarioSub: 'Everyone vs everyone · Choose a league',
    ligasDisponibles: 'Available leagues', proximamente: 'Coming soon',
    descargar: 'DOWNLOAD PICKGOL', descargarSub: 'Install the app on your phone · Free',
    inicio: 'Home', fixture: 'Fixture', grupos: 'Groups', jugadas: 'Predictions', perfil: 'Profile',
    invitarAmigos: 'Invite friends', referidosSub: 'Invite friends and earn free predictions for the World Cup',
    totalReferidos: 'Referrals', jugadasGratis: 'Free predictions', proximoNivel: 'Next level',
    tuLink: 'Your invite link', copiar: 'Copy', invitar: 'INVITE FRIENDS', recompensas: 'Rewards',
    ganado: 'Earned!', faltan: 'You need', paraGanar: 'more referrals to earn',
    miPerfil: 'My Profile', nombreUsuario: 'Username', editar: 'Edit',
    guardar: 'SAVE', cancelar: 'CANCEL', idioma: 'Language', infoCuenta: 'Account information',
    cerrarSesion: 'SIGN OUT', sinNombre: 'No name configured',
    plus: 'PICKGOL PLUS', plusSub: 'Customize your experience to the fullest',
    activarPlus: 'ACTIVATE PLUS — USD 2.59', yaEsPlus: "You're already Plus!",
    yaEsPlusSub: 'You have access to all premium features',
    procesado: 'Processed by Paddle · Secure payment',
    terminos: 'Terms · Privacy · Refunds',
  },
};

const IdiomaContext = createContext<{
  locale: string;
  t: Record<string, string>;
  setLocale: (l: string) => void;
}>({
  locale: 'es',
  t: TEXTOS.es,
  setLocale: () => {},
});

export function IdiomaProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('es');

  useEffect(() => {
    const saved = localStorage.getItem('pickgol_idioma');
    if (saved && TEXTOS[saved]) setLocaleState(saved);
  }, []);

  const setLocale = (l: string) => {
    setLocaleState(l);
    localStorage.setItem('pickgol_idioma', l);
  };

  return (
    <IdiomaContext.Provider value={{ locale, t: TEXTOS[locale] || TEXTOS.es, setLocale }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  return useContext(IdiomaContext);
}
