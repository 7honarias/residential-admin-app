
"use client";
import Link from "next/link";
import Image from "next/image";
import ContactForm from "@/components/contact/ContactForm";
import { useAppSelector } from "@/store/hooks";

export default function LandingPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  console.log("Estado de autenticación:", isAuthenticated, "Usuario:", user);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      {/* 1. NAVBAR - Minimalista y limpia */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="shrink-0" aria-label="Ir al inicio">
            <Image
              src="/logo-web-transparent.png"
              alt="Vestap"
              width={170}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:flex gap-8 font-medium text-slate-600 text-sm">
            <Link
              href="#nosotros"
              className="hover:text-indigo-600 transition-colors"
            >
              Nosotros
            </Link>
            <Link
              href="#features"
              className="hover:text-indigo-600 transition-colors"
            >
              Módulos
            </Link>
            <Link
              href="#contact"
              className="hover:text-indigo-600 transition-colors"
            >
              Contacto
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="hidden md:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Iniciar Sesión
              </Link>
            )}
            <Link
              href="#contact"
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-95"
            >
              Agendar Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION - Elegante y directo al punto */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 text-center overflow-hidden">
        {/* Fondo decorativo sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 leading-[1.1]">
            La evolución digital para <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
              conjuntos residenciales.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Automatiza el recaudo, controla visitantes en tiempo real y realiza
            asambleas legales con votación por coeficiente. Despídete del Excel
            y WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <Link
              href="#contact"
              className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-900/20 active:scale-95"
            >
              Hablar con un experto
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Explorar módulos <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FEATURES - Tarjetas flotantes con White Space */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-slate-900">
              Una suite diseñada para el control total
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Todo lo que el administrador, el vigilante y el residente
              necesitan, sincronizado en un solo lugar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                🚗
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">
                Portería Inteligente
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Buscador omnibar para el vigilante. Registra visitantes a pie o
                vehículo, asigna cupos y calcula cobros de parqueadero
                automáticamente.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                💳
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">
                Recaudo y Cartera
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                App móvil para que los residentes paguen su administración.
                Integración con pasarelas de pago y conciliación financiera en
                tiempo real.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">
                ⚖️
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">
                Asambleas en Vivo
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Cálculo de quórum por coeficiente al instante. Votaciones desde
                el celular, gestión de poderes y grabación de audio con respaldo
                legal.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* 3.5 NOSOTROS - El Manifiesto y la Cultura */}
      <section
        id="nosotros"
        className="py-24 bg-slate-50 border-y border-slate-200/50"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Misión y Visión (El Manifiesto) */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-4">
              Nuestro Propósito
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
              Transformar la administración tradicional en una experiencia
              digital simple y transparente.
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Ser la plataforma líder en Latinoamérica que facilita la vida de
              los administradores y devuelve la tranquilidad a los residentes
              mediante tecnología intuitiva, automatizando el recaudo, la
              comunicación y la gestión diaria.
            </p>
          </div>

          {/* Grid de Valores */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🤝</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Transparencia
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Promovemos claridad total en la información financiera y en la
                comunicación entre administración y residentes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Simplicidad
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Creamos soluciones fáciles de usar, pensadas para cualquier
                persona, sin importar su nivel tecnológico.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🚀</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Innovación
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Buscamos constantemente nuevas formas de mejorar la gestión
                residencial a través de tecnología de punta.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🛡️</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Confianza
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Protegemos la información financiera y personal, garantizando
                procesos 100% seguros en cada interacción.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🧩</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Eficiencia
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Optimizamos el tiempo y los recursos económicos de los conjuntos
                mediante automatización inteligente.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">🏘️</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Comunidad
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Fortalecemos la convivencia, la participación y la comunicación
                armoniosa dentro de las copropiedades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTACTO - El embudo de conversión (Formulario B2B) */}
      <section
        id="contact"
        className="py-24 bg-slate-900 text-white relative overflow-hidden"
      >
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Lado Izquierdo: Textos de venta */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                ¿Listo para modernizar tu conjunto?
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Agenda una demostración personalizada de 15 minutos. Te
                mostraremos cómo nuestra plataforma se adapta a las necesidades
                exactas de tu copropiedad.
              </p>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    ✓
                  </div>
                  Demostración en vivo del software.
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    ✓
                  </div>
                  Análisis de precios según tu número de unidades.
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    ✓
                  </div>
                  Plan de migración desde tu sistema actual.
                </li>
              </ul>
            </div>

            {/* Lado Derecho: Formulario */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Solicitar Demostración
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Image
            src="/logo-web-transparent.png"
            alt="Vestap"
            width={160}
            height={44}
            className="h-9 w-auto object-contain"
          />
          <div className="flex flex-col items-center gap-2 md:items-end">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
              <Link
                href="/terminos-y-condiciones"
                className="transition-colors hover:text-white"
              >
                Terminos y Condiciones
              </Link>
              <Link
                href="/politica-tratamiento-datos"
                className="transition-colors hover:text-white"
              >
                Politica de Datos
              </Link>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
