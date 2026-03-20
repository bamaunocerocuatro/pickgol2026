 'use client';

export default function Terms() {
  return (
    <main className="min-h-screen bg-[#020810] max-w-md mx-auto px-4 py-8 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => window.history.back()}
          className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm">←</button>
        <span className="font-condensed text-xl font-black">Términos y Condiciones</span>
      </div>

      <div className="text-xs space-y-4" style={{color:'#8892A4',lineHeight:'1.8'}}>
        <p style={{color:'rgba(255,255,255,0.4)'}}>Última actualización: Marzo 2026</p>

        <h2 className="font-condensed text-base font-bold text-white">1. Aceptación</h2>
        <p>Al usar PickGol 2026 aceptás estos términos. Si no estás de acuerdo, no uses la app.</p>

        <h2 className="font-condensed text-base font-bold text-white">2. Descripción del servicio</h2>
        <p>PickGol 2026 es una plataforma de predicciones deportivas. Los usuarios pueden crear grupos, hacer predicciones sobre partidos de fútbol y competir con amigos.</p>

        <h2 className="font-condensed text-base font-bold text-white">3. Cuenta de usuario</h2>
        <p>Sos responsable de mantener la seguridad de tu cuenta. Debés tener al menos 18 años para usar la app.</p>

        <h2 className="font-condensed text-base font-bold text-white">4. PickGol Plus</h2>
        <p>PickGol Plus es un pago único de USD 2.59 que habilita funciones premium. No hay reembolsos una vez activado el servicio.</p>

        <h2 className="font-condensed text-base font-bold text-white">5. Prode Mundial 2026</h2>
        <p>Las jugadas del Prode Mundial 2026 son pagas. Los costos se informarán antes del lanzamiento el 1 de Abril de 2026.</p>

        <h2 className="font-condensed text-base font-bold text-white">6. Pagos</h2>
        <p>Los pagos son procesados por Paddle. PickGol no almacena información de tarjetas de crédito.</p>

        <h2 className="font-condensed text-base font-bold text-white">7. Privacidad</h2>
        <p>Recopilamos email y datos de uso para mejorar el servicio. No vendemos datos a terceros.</p>

        <h2 className="font-condensed text-base font-bold text-white">8. Conducta</h2>
        <p>Está prohibido usar la app para actividades ilegales, spam o abusar del sistema de referidos.</p>

        <h2 className="font-condensed text-base font-bold text-white">9. Modificaciones</h2>
        <p>Nos reservamos el derecho de modificar estos términos. Los cambios se notificarán en la app.</p>

        <h2 className="font-condensed text-base font-bold text-white">10. Contacto</h2>
        <p>Para consultas: <span style={{color:'#C9A84C'}}>bamaunocerocuatro@gmail.com</span></p>
      </div>
    </main>
  );
}

