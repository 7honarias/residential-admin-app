import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Blog de Propiedad Horizontal en Colombia | Vestap",
  description:
    "Guías, normativa y consejos prácticos para administradores, contadores y consejos de administración de conjuntos residenciales y edificios en Colombia.",
  keywords: [
    "propiedad horizontal Colombia",
    "administración de conjuntos residenciales",
    "ley 675",
    "cuota de administración",
    "asamblea copropietarios",
    "administrador copropiedad",
  ],
  openGraph: {
    title: "Blog de Propiedad Horizontal | Vestap",
    description:
      "Recursos profesionales para la gestión de copropiedades y conjuntos residenciales en Colombia.",
    type: "website",
    url: "https://vestap.net/blog",
    locale: "es_CO",
  },
  alternates: {
    canonical: "https://vestap.net/blog",
  },
};

const categoryColors: Record<string, string> = {
  "Marco Legal": "bg-indigo-100 text-indigo-700",
  Gestión: "bg-emerald-100 text-emerald-700",
  Asambleas: "bg-purple-100 text-purple-700",
  Finanzas: "bg-emerald-100 text-emerald-700",
  "Gobierno Corporativo": "bg-purple-100 text-purple-700",
};

export default function BlogPage() {
  const featured = blogPosts.filter((p) => p.featured);
  const rest = blogPosts.filter((p) => !p.featured);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* Header */}
      <section className="border-b border-slate-200 bg-white pt-36 pb-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-indigo-100">
            Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 leading-tight">
            Recursos para la Gestión de{" "}
            <span className="text-indigo-600">Propiedad Horizontal</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Guías prácticas, normativa actualizada y consejos de expertos para
            administradores, contadores y consejos de administración de
            conjuntos residenciales en Colombia.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Featured Posts */}
        {featured.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-8">
              Artículos Destacados
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featured.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="bg-gradient-to-br from-indigo-50 to-slate-50 h-40 flex items-center justify-center border-b border-slate-100">
                    <div className="text-center px-6">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          categoryColors[post.category] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.readTime} de lectura</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium group-hover:gap-2 gap-1 transition-all">
                      Leer artículo
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Posts Grid */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-8">
            Todos los Artículos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
              >
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    categoryColors[post.category] ??
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {post.category}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-4 mb-2 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-3">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <span className="text-xs text-slate-400">
                    {post.readTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            ¿Listo para digitalizar tu copropiedad?
          </h2>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Vestap es la plataforma todo-en-uno para la gestión de conjuntos
            residenciales en Colombia. Pruébala gratis.
          </p>
          <Link
            href="/#contacto"
            className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Solicitar demo gratuita
          </Link>
        </section>
      </div>
    </main>
  );
}
