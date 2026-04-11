import Link from "next/link";

const policyItems = [
  {
    title: "Responsable del tratamiento",
    content:
      "Vestap es responsable del tratamiento de datos personales en los casos que corresponda y opera principalmente en Colombia.",
  },
  {
    title: "Que datos tratamos",
    content:
      "Podemos tratar datos de identificacion, contacto, relacion con la copropiedad, datos operativos, financieros y tecnicos necesarios para el servicio.",
  },
  {
    title: "Para que usamos los datos",
    content:
      "Usamos los datos para operar la plataforma, autenticar usuarios, atender soporte, gestionar pagos y reforzar seguridad y trazabilidad.",
  },
  {
    title: "No comercializacion no autorizada",
    content:
      "No compartimos datos personales con terceros para fines comerciales propios no autorizados.",
  },
  {
    title: "Derechos del titular",
    content:
      "Puedes solicitar conocer, actualizar, rectificar o suprimir tus datos, asi como revocar autorizaciones cuando sea procedente por ley.",
  },
  {
    title: "Integraciones y terceros",
    content:
      "Usamos servicios de terceros como pasarelas de pago, Supabase y AWS para operar la plataforma. Las fallas propias de esos proveedores estan fuera de nuestro control directo.",
  },
  {
    title: "Retencion y eliminacion",
    content:
      "Si el contrato termina, los datos se conservan hasta 2 meses para posible reactivacion y luego se eliminan o anonimizan, salvo obligacion legal.",
  },
  {
    title: "Canal de contacto",
    content:
      "Puedes escribir a 7honarias@gmail.com para consultas, peticiones, quejas o reclamos sobre tratamiento de datos.",
  },
];

export default function DataPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14 md:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Vestap
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Politica de Tratamiento de Datos (Resumen)
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Este resumen explica de forma clara como tratamos los datos
            personales. La version robusta y completa esta en el documento
            interno de politica de datos.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Ultima actualizacion: 10 de abril de 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-12">
        <div className="space-y-4">
          {policyItems.map((item) => (
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
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            Contacto de datos personales: 7honarias@gmail.com | NIT: pendiente de
            asignacion
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terminos-y-condiciones"
              className="font-semibold text-slate-700 transition-colors hover:text-slate-900"
            >
              Ver terminos
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
