"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function Navbar({ hideActions }: { hideActions?: boolean } = {}) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Anchor links work on home; from other pages use full path
  const href = (anchor: string) => (isHome ? anchor : `/${anchor}`);

  return (
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
            href={href("#nosotros")}
            className="hover:text-indigo-600 transition-colors"
          >
            Nosotros
          </Link>
          <Link
            href={href("#features")}
            className="hover:text-indigo-600 transition-colors"
          >
            Módulos
          </Link>
          <Link
            href="/clasificados"
            className="hover:text-indigo-600 transition-colors"
          >
            Clasificados
          </Link>
          <Link
            href="/blog"
            className="hover:text-indigo-600 transition-colors"
          >
            Blog
          </Link>
          <Link
            href={href("#contact")}
            className="hover:text-indigo-600 transition-colors"
          >
            Contacto
          </Link>
        </div>

        {!hideActions && (
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
              href={href("#contact")}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-95"
            >
              Agendar Demo
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
