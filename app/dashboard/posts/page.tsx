"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  IPost,
  PostType,
  PostScope,
  fetchPostsList,
} from "@/services/posts.service";
import PostsList from "@/components/posts/PostsList";
import ManagePostModal from "@/components/posts/ManagePostModal";
import { AlertCircle, Newspaper } from "lucide-react";

export default function PostsPage() {
  const token = useAppSelector((state) => state.auth.token);
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const complexId = activeComplex?.id;

  // Data state
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<PostType | "">("");
  const [scopeFilter, setScopeFilter] = useState<PostScope | "">("");
  const [showCensored, setShowCensored] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState("");

  const loadPosts = useCallback(async () => {
    if (!token || !complexId) return;
    try {
      setLoading(true);
      const response = await fetchPostsList({
        token,
        complexId,
        page,
        type: typeFilter,
        scope: scopeFilter,
        showCensored,
        search: searchQuery || undefined,
      });
      setPosts(response.data);
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  }, [token, complexId, page, typeFilter, scopeFilter, showCensored, searchQuery]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Reset page when filters change
  const handleTypeChange = (type: PostType | "") => {
    setTypeFilter(type);
    setPage(0);
  };

  const handleScopeChange = (scope: PostScope | "") => {
    setScopeFilter(scope);
    setPage(0);
  };

  const handleShowCensoredChange = (show: boolean) => {
    setShowCensored(show);
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    loadPosts();
  };

  const handlePostAction = (post: IPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setSuccessMessage("Acción realizada exitosamente");
    loadPosts();
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  if (!complexId || !token) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <p className="text-sm text-yellow-700">
          No hay complejo activo. Por favor, selecciona uno.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Publicaciones</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Gestiona las publicaciones del feed de tu comunidad
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Newspaper className="w-4 h-4" />
          <span>{posts.length} publicaciones</span>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Posts list */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <PostsList
            token={token}
            complexId={complexId}
            posts={posts}
            loading={loading}
            page={page}
            hasMore={hasMore}
            typeFilter={typeFilter}
            scopeFilter={scopeFilter}
            showCensored={showCensored}
            searchQuery={searchQuery}
            onPageChange={setPage}
            onTypeFilterChange={handleTypeChange}
            onScopeFilterChange={handleScopeChange}
            onShowCensoredChange={handleShowCensoredChange}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onPostAction={handlePostAction}
          />
        </div>
      </div>

      {/* Manage post modal */}
      <ManagePostModal
        isOpen={isModalOpen}
        post={selectedPost}
        token={token}
        complexId={complexId}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPost(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
