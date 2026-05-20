import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  blogPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog-posts";
import Navbar from "@/components/Navbar";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Artículo no encontrado | Vestap" };
  }

  const description = post.excerpt.slice(0, 160);
  const url = `https://vestap.co/blog/${post.slug}`;

  return {
    title: `${post.title} | Vestap`,
    description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      locale: "es_CO",
      publishedTime: post.dateISO,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

const categoryColors: Record<string, string> = {
  "Marco Legal": "bg-indigo-100 text-indigo-700",
  "Gestión": "bg-emerald-100 text-emerald-700",
  "Asambleas": "bg-purple-100 text-purple-700",
  "Finanzas": "bg-emerald-100 text-emerald-700",
  "Gobierno Corporativo": "bg-purple-100 text-purple-700",
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = getRelatedPosts(post, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    author: {
      "@type": "Organization",
      name: post.author,
      url: "https://vestap.co",
    },
    publisher: {
      "@type": "Organization",
      name: "Vestap",
      url: "https://vestap.co",
      logo: {
        "@type": "ImageObject",
        url: "https://vestap.co/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://vestap.co/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    inLanguage: "es-CO",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white">
        <Navbar />
        {/* Breadcrumbs */}
        <div className="mt-[73px] bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <nav
              aria-label="breadcrumb"
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Inicio
              </Link>
              <span>/</span>
              <Link
                href="/blog"
                className="hover:text-indigo-600 transition-colors"
              >
                Blog
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium truncate max-w-xs">
                {post.title}
              </span>
            </nav>
          </div>
        </div>

        {/* Article Header */}
        <header className="bg-gradient-to-br from-slate-900 to-indigo-900 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 ${
                categoryColors[post.category] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-indigo-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
                <span>
                  {post.author} · {post.authorRole}
                </span>
              </div>
              <span>·</span>
              <time dateTime={post.dateISO}>{post.date}</time>
              <span>·</span>
              <span>{post.readTime} de lectura</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main content */}
            <article className="flex-1 min-w-0">
              <div
                className="prose prose-slate prose-lg max-w-none
                  prose-headings:font-bold prose-headings:text-slate-800
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-7 prose-h3:mb-3
                  prose-p:text-slate-600 prose-p:leading-relaxed
                  prose-ul:text-slate-600 prose-ol:text-slate-600
                  prose-li:leading-relaxed
                  prose-strong:text-slate-800
                  prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                  prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              <div className="mt-10 pt-8 border-t border-slate-200">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="sticky top-8 space-y-6">
                {/* CTA Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">
                    Gestiona tu conjunto con Vestap
                  </h3>
                  <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
                    Automatiza cobros, asambleas, visitantes y más desde una
                    sola plataforma.
                  </p>
                  <Link
                    href="/#contacto"
                    className="block bg-white text-indigo-600 text-sm font-semibold px-5 py-2.5 rounded-xl text-center hover:bg-indigo-50 transition-colors"
                  >
                    Ver demo gratuita
                  </Link>
                </div>

                {/* Related posts */}
                {related.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-800 mb-4">
                      Artículos Relacionados
                    </h3>
                    <div className="space-y-4">
                      {related.map((rel) => (
                        <Link
                          key={rel.slug}
                          href={`/blog/${rel.slug}`}
                          className="block group"
                        >
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              categoryColors[rel.category] ??
                              "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {rel.category}
                          </span>
                          <p className="text-sm text-slate-700 font-medium mt-1.5 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                            {rel.title}
                          </p>
                          <span className="text-xs text-slate-400 mt-1 block">
                            {rel.readTime}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/blog"
                      className="block text-center text-indigo-600 text-sm font-medium mt-5 hover:underline"
                    >
                      Ver todos los artículos →
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Back to blog */}
          <div className="mt-16 pt-8 border-t border-slate-200">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:gap-3 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Volver al blog
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
