import Link from "next/link";

const summaryItems = [
  {
    title: "Quienes somos",
    content:
      "Vestap presta servicios de software para la administracion de conjuntos residenciales en Colombia.",
  },
  {
    title: "Quienes pueden usar la plataforma",
    content:
      "Solo mayores de edad. Los roles habilitados incluyen administradores, residentes, propietarios, vigilantes, proveedores y visitantes autorizados.",
  },
  {
    title: "Planes y renovacion",
    content:
      "Manejamos suscripcion anual con pago mensual o pago unico con descuento. Algunas promociones incluyen prueba gratuita. La renovacion es automatica salvo cancelacion o acuerdo distinto.",
  },
  {
    title: "Pagos y suspension",
    content:
      "Se aceptan pagos en efectivo y tarjeta, ademas de medios habilitados por pasarelas. Si hay mora de dos meses, el servicio puede ser suspendido.",
  },
  {
    title: "Reglas de uso",
    content:
      "Esta prohibida la suplantacion de identidad y el uso indebido de datos. El incumplimiento puede causar bloqueo o cancelacion de cuenta.",
  },
  {
    title: "Propiedad intelectual y datos",
    content:
      "La plataforma y la aplicacion son propiedad de Vestap. Los datos cargados pertenecen a los conjuntos y pueden solicitar su eliminacion.",
  },
  {
    title: "Integraciones externas",
    content:
      "Usamos terceros como pasarelas, Supabase y AWS. No respondemos por fallas propias de esos proveedores.",
  },
  {
    title: "Soporte",
    content:
      "Atendemos solicitudes en horario de oficina, de lunes a viernes.",
  },
  {
    title: "Terminacion y retencion de datos",
    content:
      "Al finalizar el contrato, los datos se conservan hasta 2 meses para posible reactivacion. Luego se eliminan o anonimizan segun corresponda.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14 md:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Vestap
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Terminos y Condiciones (Resumen)
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Este resumen facilita la lectura de las reglas principales de uso.
            La version completa y legalmente robusta se encuentra en el
            documento interno de terminos y condiciones.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Ultima actualizacion: 10 de abril de 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-12">
        <div className="space-y-4">
          {summaryItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
                {item.content}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            Contacto legal: 7honarias@gmail.com | NIT: pendiente de asignacion
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/politica-tratamiento-datos"
              className="font-semibold text-slate-700 transition-colors hover:text-slate-900"
            >
              Ver politica de datos
            </Link>
            <Link
              href="/"
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
