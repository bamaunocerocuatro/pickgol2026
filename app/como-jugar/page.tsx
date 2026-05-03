'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useIdioma } from '../context/IdiomaContext';

export default function ComoJugar() {
  const router = useRouter();
  const { locale } = useIdioma();
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>('jugabilidad');

  const toggle = (key: string) => setSeccionAbierta(seccionAbierta === key ? null : key);

  const contenido: Record<string, any> = {
    es: {
      titulo: 'Cómo jugar',
      secciones: [
        {
          key: 'jugabilidad',
          titulo: '⚽ Jugabilidad general',
          contenido: `PickGol es una app de predicciones deportivas donde podés crear jugadas para ligas y el Mundial 2026.\n\nCada jugada tiene dos partes:\n\n1. Variables globales — preguntas sobre la fecha o torneo completo (cantidad de goles, tarjetas, etc.)\n2. Predicciones de partidos — el resultado exacto de cada partido de la fecha o fase de grupos.`,
        },
        {
          key: 'grupos',
          titulo: '👥 Grupos privados',
          contenido: `Podés crear un grupo privado e invitar a tus amigos con un código único.\n\nEl creador del grupo puede:\n• Elegir la liga o torneo\n• Configurar variables personalizadas (con Plus)\n• Habilitar o deshabilitar el chat\n• Activar el control de pagos internos\n• Eliminar el grupo\n\nCualquier miembro puede crear jugadas dentro del grupo.`,
        },
        {
          key: 'jugadas',
          titulo: '🎯 Jugadas',
          contenido: `Una jugada es tu predicción para una fecha o torneo completo.\n\nImportante:\n• Las jugadas NO se pueden modificar una vez confirmadas\n• Las jugadas se bloquean cuando empieza el primer partido de la fecha (ligas) o 48hs antes del inicio del Mundial\n• Podés tener múltiples jugadas en distintos grupos`,
        },
        {
          key: 'comunitario',
          titulo: '🌍 Prode Comunitario',
          contenido: `El Prode Comunitario es un torneo abierto donde todos los usuarios juegan entre sí.\n\n• En ligas: una sola jugada por liga por fecha\n• En el Mundial: una sola jugada por usuario para toda la fase de grupos, completamente gratis\n• El ranking es público y se actualiza automáticamente`,
        },
        {
          key: 'puntos',
          titulo: '🏆 Sistema de puntos',
          contenido: `Los puntos son iguales para ligas y Mundial:\n\nVariables:\n• Amarillas exactas: 12 pts\n• Rojas exactas: 10 pts\n• Goles totales exactos: 8 pts\n• Partido con más goles (exacto): 10 pts\n• Penales exactos: 10 pts\n• Gol antes del min 5 (acierto): 5 pts\n• Gol en el alargue (acierto): 6 pts\n• Resultado 0-0 (acierto): 2 pts\n• VAR anula gol (acierto): 5 pts\n\nPredicciones por partido:\n• Resultado exacto (goles): 5 pts\n• Ganador correcto (sin resultado exacto): 2 pts\n\nCon Plus podés personalizar los puntos de cada variable.`,
        },
        {
          key: 'control-pagos',
          titulo: '💰 Control de pagos internos',
          contenido: `El control de pagos es una herramienta opcional para el creador del grupo.\n\nPermite registrar quién pagó y quién no en tu grupo, cuando organizás torneos con entrada entre amigos.\n\nPickGol NO cobra ni gestiona estos pagos — los pagos son por fuera de la app, directamente entre los jugadores y el organizador.`,
        },
        {
          key: 'chat',
          titulo: '💬 Chat del grupo',
          contenido: `El creador del grupo puede habilitar o deshabilitar el chat en cualquier momento.\n\nEl chat permite que los miembros del grupo se comuniquen dentro de la app, ideal para grupos de amigos o torneos organizados.`,
        },
        {
          key: 'referidos',
          titulo: '🎁 Referidos',
          contenido: `El sistema de referidos es exclusivo para el Mundial 2026.\n\nInvitá amigos con tu link único y ganá jugadas gratis del Mundial:\n• 3 referidos → 1 jugada gratis\n• 6 referidos → 2 jugadas gratis\n• 10 referidos → 5 jugadas gratis\n\nLas ligas son completamente gratis, por lo que los referidos solo aplican a jugadas del Mundial.`,
        },
        {
          key: 'mundial',
          titulo: '🏆 Mundial 2026',
          contenido: `El Mundial 2026 tiene su propia sección con reglas especiales:\n\n• Cada usuario tiene 1 jugada gratis para toda la fase de grupos\n• Podés comprar jugadas adicionales por USD 0.99 cada una\n• Con Plus tenés jugadas ilimitadas\n• Las predicciones incluyen variables globales + todos los partidos de la fase de grupos (72 partidos)\n• Las jugadas se bloquean 48hs antes del inicio del Mundial (9 de junio 2026)\n• Los resultados se actualizan automáticamente`,
        },
        {
          key: 'plus',
          titulo: '⭐ PickGol Plus',
          contenido: `PickGol Plus es un pago único de USD 2.79 que desbloquea:\n\n• Variables personalizadas en ligas y Mundial\n• Edición del puntaje de cada variable\n• Jugadas ilimitadas en el Mundial\n\nEl Plus aplica a tu cuenta para siempre — no es una suscripción.`,
        },
        {
          key: 'costos',
          titulo: '💵 Costos',
          contenido: `• Ligas: completamente GRATIS\n• Mundial: 1 jugada gratis, jugadas extra USD 0.99 c/u o ilimitadas con Plus\n• PickGol Plus: USD 2.79 pago único\n\nPickGol nunca cobra por crear grupos ni por participar en ligas.`,
        },
        {
          key: 'terminos',
          titulo: '📄 Términos y condiciones',
          contenido: `Al usar PickGol aceptás los siguientes términos:\n\n• PickGol es una plataforma de predicciones deportivas sin apuestas de dinero real\n• Las jugadas no se pueden modificar una vez confirmadas\n• Los pagos del Plus son finales y no reembolsables salvo error técnico\n• Los pagos internos de grupos son acuerdos entre usuarios — PickGol no interviene\n• PickGol puede modificar las reglas con previo aviso\n\nPara consultas o soporte: billing@pickgol.com`,
        },
        {
          key: 'faq',
          titulo: '❓ Preguntas frecuentes',
          contenido: `¿Puedo modificar mi jugada?\nNo. Una vez confirmada no se puede cambiar.\n\n¿Cuántas jugadas puedo tener en ligas?\nTodas las que quieras — las ligas son gratis.\n\n¿El Plus se cobra mensualmente?\nNo, es un pago único para siempre.\n\n¿Los pagos de grupos son seguros?\nPickGol no gestiona esos pagos. Son acuerdos entre vos y el organizador.\n\n¿Puedo jugar en varios grupos a la vez?\nSí, podés tener jugadas en múltiples grupos.\n\n¿Cuándo se calculan los puntos?\nLos puntos se actualizan automáticamente cuando terminan los partidos.\n\n¿Puedo borrar mi grupo?\nSí, solo el creador puede eliminar el grupo.\n\n¿Cómo contacto a soporte?\nbilling@pickgol.com`,
        },
      ],
    },
    pt: {
      titulo: 'Como jogar',
      secciones: [
        {
          key: 'jugabilidad',
          titulo: '⚽ Jogabilidade geral',
          contenido: `PickGol é um app de previsões esportivas onde você pode criar apostas para ligas e a Copa do Mundo 2026.\n\nCada aposta tem duas partes:\n\n1. Variáveis globais — perguntas sobre a rodada ou torneio completo\n2. Previsões de partidas — o resultado exato de cada jogo`,
        },
        {
          key: 'grupos',
          titulo: '👥 Grupos privados',
          contenido: `Você pode criar um grupo privado e convidar amigos com um código único.\n\nO criador pode:\n• Escolher a liga ou torneio\n• Configurar variáveis personalizadas (com Plus)\n• Habilitar ou desabilitar o chat\n• Ativar o controle de pagamentos internos\n• Excluir o grupo`,
        },
        {
          key: 'jugadas',
          titulo: '🎯 Apostas',
          contenido: `Uma aposta é sua previsão para uma rodada ou torneio completo.\n\nImportante:\n• As apostas NÃO podem ser modificadas após a confirmação\n• As apostas são bloqueadas quando começa o primeiro jogo da rodada (ligas) ou 48h antes do início da Copa\n• Você pode ter várias apostas em grupos diferentes`,
        },
        {
          key: 'comunitario',
          titulo: '🌍 Prode Comunitário',
          contenido: `O Prode Comunitário é um torneio aberto onde todos os usuários jogam entre si.\n\n• Nas ligas: uma aposta por liga por rodada\n• Na Copa: uma aposta por usuário para toda a fase de grupos, completamente grátis\n• O ranking é público e atualizado automaticamente`,
        },
        {
          key: 'puntos',
          titulo: '🏆 Sistema de pontos',
          contenido: `Os pontos são iguais para ligas e Copa:\n\nVariáveis:\n• Cartões amarelos exatos: 12 pts\n• Cartões vermelhos exatos: 10 pts\n• Total de gols exato: 8 pts\n• Jogo com mais gols (exato): 10 pts\n• Pênaltis exatos: 10 pts\n• Gol antes do min 5 (acerto): 5 pts\n• Gol na prorrogação (acerto): 6 pts\n• Resultado 0-0 (acerto): 2 pts\n• VAR anula gol (acerto): 5 pts\n\nPrevisões por partida:\n• Resultado exato: 5 pts\n• Vencedor correto: 2 pts`,
        },
        {
          key: 'control-pagos',
          titulo: '💰 Controle de pagamentos',
          contenido: `O controle de pagamentos é uma ferramenta opcional para o criador do grupo.\n\nPermite registrar quem pagou e quem não pagou no seu grupo.\n\nPickGol NÃO cobra nem gerencia esses pagamentos — são acordos entre os jogadores.`,
        },
        {
          key: 'chat',
          titulo: '💬 Chat do grupo',
          contenido: `O criador do grupo pode habilitar ou desabilitar o chat a qualquer momento.\n\nO chat permite que os membros se comuniquem dentro do app.`,
        },
        {
          key: 'referidos',
          titulo: '🎁 Indicações',
          contenido: `O sistema de indicações é exclusivo para a Copa 2026.\n\nConvide amigos com seu link único e ganhe apostas grátis da Copa:\n• 3 indicados → 1 aposta grátis\n• 6 indicados → 2 apostas grátis\n• 10 indicados → 5 apostas grátis`,
        },
        {
          key: 'mundial',
          titulo: '🏆 Copa do Mundo 2026',
          contenido: `A Copa 2026 tem sua própria seção com regras especiais:\n\n• Cada usuário tem 1 aposta grátis para toda a fase de grupos\n• Apostas adicionais por USD 0,99 cada ou ilimitadas com Plus\n• As previsões incluem variáveis globais + todos os 72 jogos da fase de grupos\n• As apostas são bloqueadas 48h antes do início da Copa (9 de junho 2026)`,
        },
        {
          key: 'plus',
          titulo: '⭐ PickGol Plus',
          contenido: `PickGol Plus é um pagamento único de USD 2,79 que desbloqueia:\n\n• Variáveis personalizadas em ligas e Copa\n• Edição da pontuação de cada variável\n• Apostas ilimitadas na Copa\n\nO Plus é válido para sempre — não é uma assinatura.`,
        },
        {
          key: 'costos',
          titulo: '💵 Custos',
          contenido: `• Ligas: completamente GRÁTIS\n• Copa: 1 aposta grátis, apostas extras USD 0,99 ou ilimitadas com Plus\n• PickGol Plus: USD 2,79 pagamento único`,
        },
        {
          key: 'terminos',
          titulo: '📄 Termos e condições',
          contenido: `Ao usar o PickGol você aceita os seguintes termos:\n\n• PickGol é uma plataforma de previsões esportivas sem apostas em dinheiro real\n• As apostas não podem ser modificadas após a confirmação\n• Os pagamentos do Plus são finais e não reembolsáveis salvo erro técnico\n• Os pagamentos internos de grupos são acordos entre usuários\n• PickGol pode modificar as regras com aviso prévio\n\nContato: billing@pickgol.com`,
        },
        {
          key: 'faq',
          titulo: '❓ Perguntas frequentes',
          contenido: `Posso modificar minha aposta?\nNão. Uma vez confirmada não pode ser alterada.\n\nQuantas apostas posso ter nas ligas?\nQuantas quiser — as ligas são grátis.\n\nO Plus é cobrado mensalmente?\nNão, é um pagamento único para sempre.\n\nPosso jogar em vários grupos ao mesmo tempo?\nSim, você pode ter apostas em vários grupos.\n\nComo entro em contato com o suporte?\nbilling@pickgol.com`,
        },
      ],
    },
    en: {
      titulo: 'How to play',
      secciones: [
        {
          key: 'jugabilidad',
          titulo: '⚽ General gameplay',
          contenido: `PickGol is a sports prediction app where you can create predictions for leagues and the 2026 World Cup.\n\nEach prediction has two parts:\n\n1. Global variables — questions about the matchday or full tournament\n2. Match predictions — the exact result of each game`,
        },
        {
          key: 'grupos',
          titulo: '👥 Private groups',
          contenido: `You can create a private group and invite friends with a unique code.\n\nThe creator can:\n• Choose the league or tournament\n• Set custom variables (with Plus)\n• Enable or disable the chat\n• Activate internal payment tracking\n• Delete the group`,
        },
        {
          key: 'jugadas',
          titulo: '🎯 Predictions',
          contenido: `A prediction is your forecast for a matchday or full tournament.\n\nImportant:\n• Predictions CANNOT be modified once confirmed\n• Predictions are locked when the first match starts (leagues) or 48h before the World Cup begins\n• You can have multiple predictions in different groups`,
        },
        {
          key: 'comunitario',
          titulo: '🌍 Community Predictions',
          contenido: `The Community Predictions is an open tournament where all users compete against each other.\n\n• In leagues: one prediction per league per matchday\n• In the World Cup: one prediction per user for the entire group stage, completely free\n• The ranking is public and updated automatically`,
        },
        {
          key: 'puntos',
          titulo: '🏆 Points system',
          contenido: `Points are the same for leagues and World Cup:\n\nVariables:\n• Exact yellow cards: 12 pts\n• Exact red cards: 10 pts\n• Exact total goals: 8 pts\n• Highest scoring match (exact): 10 pts\n• Exact penalties: 10 pts\n• Goal before min 5 (correct): 5 pts\n• Goal in extra time (correct): 6 pts\n• 0-0 result (correct): 2 pts\n• VAR disallows goal (correct): 5 pts\n\nMatch predictions:\n• Exact result: 5 pts\n• Correct winner: 2 pts`,
        },
        {
          key: 'control-pagos',
          titulo: '💰 Payment tracking',
          contenido: `Payment tracking is an optional tool for the group creator.\n\nIt lets you record who has paid and who hasn't in your group.\n\nPickGol does NOT charge or manage these payments — they are agreements between players.`,
        },
        {
          key: 'chat',
          titulo: '💬 Group chat',
          contenido: `The group creator can enable or disable the chat at any time.\n\nThe chat allows group members to communicate within the app.`,
        },
        {
          key: 'referidos',
          titulo: '🎁 Referrals',
          contenido: `The referral system is exclusive to the 2026 World Cup.\n\nInvite friends with your unique link and earn free World Cup predictions:\n• 3 referrals → 1 free prediction\n• 6 referrals → 2 free predictions\n• 10 referrals → 5 free predictions`,
        },
        {
          key: 'mundial',
          titulo: '🏆 World Cup 2026',
          contenido: `The World Cup 2026 has its own section with special rules:\n\n• Each user gets 1 free prediction for the entire group stage\n• Additional predictions for USD 0.99 each or unlimited with Plus\n• Predictions include global variables + all 72 group stage matches\n• Predictions are locked 48h before the World Cup starts (June 9, 2026)`,
        },
        {
          key: 'plus',
          titulo: '⭐ PickGol Plus',
          contenido: `PickGol Plus is a one-time payment of USD 2.79 that unlocks:\n\n• Custom variables in leagues and World Cup\n• Edit the score of each variable\n• Unlimited predictions in the World Cup\n\nPlus is valid forever — it's not a subscription.`,
        },
        {
          key: 'costos',
          titulo: '💵 Costs',
          contenido: `• Leagues: completely FREE\n• World Cup: 1 free prediction, extra predictions USD 0.99 each or unlimited with Plus\n• PickGol Plus: USD 2.79 one-time payment`,
        },
        {
          key: 'terminos',
          titulo: '📄 Terms and conditions',
          contenido: `By using PickGol you agree to the following terms:\n\n• PickGol is a sports prediction platform with no real money betting\n• Predictions cannot be modified once confirmed\n• Plus payments are final and non-refundable except for technical errors\n• Internal group payments are agreements between users — PickGol does not intervene\n• PickGol may modify rules with prior notice\n\nContact: billing@pickgol.com`,
        },
        {
          key: 'faq',
          titulo: '❓ FAQ',
          contenido: `Can I modify my prediction?\nNo. Once confirmed it cannot be changed.\n\nHow many predictions can I have in leagues?\nAs many as you want — leagues are free.\n\nIs Plus a monthly charge?\nNo, it's a one-time payment forever.\n\nCan I play in multiple groups at the same time?\nYes, you can have predictions in multiple groups.\n\nHow do I contact support?\nbilling@pickgol.com`,
        },
      ],
    },
  };

  const c = contenido[locale] || contenido.es;

  const renderLinea = (linea: string, i: number) => {
    if (linea === '') return <div key={i} className="h-2" />;
    if (linea.startsWith('•')) return (
      <div key={i} className="flex gap-2 mb-1">
        <span style={{ color: '#E8192C' }}>•</span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{linea.substring(1).trim()}</span>
      </div>
    );
    if (linea.includes('billing@pickgol.com')) return (
      <p key={i} className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {linea.split('billing@pickgol.com').map((parte, j, arr) => (
          <span key={j}>
            {parte}
            {j < arr.length - 1 && (
              <a href="mailto:billing@pickgol.com" style={{ color: '#E8192C', textDecoration: 'underline' }}>
                billing@pickgol.com
              </a>
            )}
          </span>
        ))}
      </p>
    );
    if (linea.includes(':') && !linea.startsWith(' ') && linea.length < 60) return (
      <div key={i} className="font-condensed text-sm font-bold mt-3 mb-1" style={{ color: '#C9A84C' }}>{linea}</div>
    );
    return <p key={i} className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{linea}</p>;
  };

  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto pb-20">

      <div style={{ background: 'linear-gradient(160deg,#0A1F5C,#0D2870)', borderBottom: '1px solid rgba(255,255,255,0.07)' }} className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/perfil')}
            className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Perfil · <b style={{ color: 'rgba(255,255,255,0.65)' }}>{c.titulo}</b>
          </span>
        </div>
        <h1 className="font-condensed text-3xl font-black mb-1">📖 {c.titulo}</h1>
        <p className="text-xs" style={{ color: '#8892A4' }}>PickGol 2026 · Todo lo que necesitás saber</p>
      </div>

      <div className="px-4 py-4">
        {c.secciones.map((s: any) => (
          <div key={s.key} className="rounded-2xl mb-3 overflow-hidden"
            style={{ background: '#0D1B3E', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-4 py-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggle(s.key)}>
              <div className="font-condensed text-base font-black">{s.titulo}</div>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>{seccionAbierta === s.key ? '▲' : '▼'}</span>
            </div>
            {seccionAbierta === s.key && (
              <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {s.contenido.split('\n').map((linea: string, i: number) => renderLinea(linea, i))}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-2xl p-4 mt-2" style={{ background: 'rgba(232,25,44,0.07)', border: '1px solid rgba(232,25,44,0.2)' }}>
          <div className="text-sm font-bold mb-1" style={{ color: '#E8192C' }}>📧 Soporte</div>
          <a href="mailto:billing@pickgol.com" style={{ color: '#E8192C', textDecoration: 'underline' }} className="text-xs">
            billing@pickgol.com
          </a>
        </div>
      </div>

    </main>
  );
}