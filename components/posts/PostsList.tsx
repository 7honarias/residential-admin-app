"use client";

import { useState, useCallback } from "react";
import {
  IPost,
  PostType,
  PostScope,
  fetchPostsList,
} from "@/services/posts.service";
import {
  Search,
  Filter,
  Pin,
  Eye,
  EyeOff,
  MessageSquare,
  Heart,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  BarChart3,
  Tag,
  Users2,
  X,
} from "lucide-react";

// ==========================================
// CONSTANTS
// ==========================================

const POST_TYPE_CONFIG: Record<
  PostType,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  ANNOUNCEMENT: {
    label: "Anuncio",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Megaphone,
  },
  POLL: {
    label: "Encuesta",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: BarChart3,
  },
  CLASSIFIED: {
    label: "Clasificado",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: Tag,
  },
  SOCIAL: {
    label: "Social",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: Users2,
  },
};

const SCOPE_LABELS: Record<PostScope, string> = {
  GLOBAL: "Global",
  COMPLEX: "Conjunto",
};

// ==========================================
// PROPS
// ==========================================

interface PostsListProps {
  token: string;
  complexId: string;
  posts: IPost[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  typeFilter: PostType | "";
  scopeFilter: PostScope | "";
  showCensored: boolean;
  searchQuery: string;
  onPageChange: (page: number) => void;
  onTypeFilterChange: (type: PostType | "") => void;
  onScopeFilterChange: (scope: PostScope | "") => void;
  onShowCensoredChange: (show: boolean) => void;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onPostAction: (post: IPost) => void;
}

// ==========================================
// COMPONENT
// ==========================================

export default function PostsList({
  posts,
  loading,
  page,
  hasMore,
  typeFilter,
  scopeFilter,
  showCensored,
  searchQuery,
  onPageChange,
  onTypeFilterChange,
  onScopeFilterChange,
  onShowCensoredChange,
  onSearchChange,
  onSearch,
  onPostAction,
}: PostsListProps) {
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en contenido..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                onSearch();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as PostType | "")}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="ANNOUNCEMENT">Anuncios</option>
          <option value="POLL">Encuestas</option>
          <option value="CLASSIFIED">Clasificados</option>
          <option value="SOCIAL">Social</option>
        </select>

        {/* Scope filter */}
        <select
          value={scopeFilter}
          onChange={(e) =>
            onScopeFilterChange(e.target.value as PostScope | "")
          }
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los alcances</option>
          <option value="COMPLEX">Conjunto</option>
          <option value="GLOBAL">Global</option>
        </select>

        {/* Show censored toggle */}
        <button
          onClick={() => onShowCensoredChange(!showCensored)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
            showCensored
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {showCensored ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {showCensored ? "Censurados visibles" : "Mostrar censurados"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">
            No se encontraron publicaciones
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Intenta ajustar los filtros o buscar otro término
          </p>
        </div>
      )}

      {/* Posts list */}
      {!loading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => {
            const typeConfig = POST_TYPE_CONFIG[post.postType] || POST_TYPE_CONFIG.SOCIAL;
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={post.id}
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                  post.isCensored ? "border-red-200 bg-red-50/30" : ""
                } ${post.isPinned ? "border-blue-200 bg-blue-50/20" : ""}`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Content */}
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {/* Post type badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {typeConfig.label}
                        </span>

                        {/* Scope badge */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {SCOPE_LABELS[post.scope]}
                        </span>

                        {/* Pinned badge */}
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Pin className="w-3 h-3" />
                            Fijado
                          </span>
                        )}

                        {/* Censored badge */}
                        {post.isCensored && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <EyeOff className="w-3 h-3" />
                            Censurado
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {post.content}
                      </p>

                      {/* Censor reason */}
                      {post.isCensored && post.censorReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Razón: {post.censorReason}
                        </p>
                      )}

                      {/* Media indicator */}
                      {post.mediaUrls.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          📎 {post.mediaUrls.length} archivo(s) adjunto(s)
                        </p>
                      )}

                      {/* Author + date */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>
                          {post.author?.name || "Usuario desconocido"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Heart className="w-3.5 h-3.5" />
                          {post.metrics.reactionsCount}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {post.metrics.commentsCount}
                        </span>
                        {post.metrics.reportsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {post.metrics.reportsCount} reporte(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action button */}
                    <button
                      onClick={() => onPostAction(post)}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      Gestionar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && posts.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <button
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-slate-500">Página {page + 1}</span>
          <button
            disabled={!hasMore}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
