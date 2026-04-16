"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  IPost,
  PostAction,
  managePost,
} from "@/services/posts.service";
import {
  X,
  Pin,
  PinOff,
  EyeOff,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ManagePostModalProps {
  isOpen: boolean;
  post: IPost | null;
  token: string;
  complexId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManagePostModal({
  isOpen,
  post,
  token,
  complexId,
  onClose,
  onSuccess,
}: ManagePostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [censorReason, setCensorReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !post) return null;

  const handleAction = async (action: PostAction) => {
    if (action === "DELETE_POST" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    if (action === "CENSOR_POST" && !censorReason.trim()) {
      setError("Debes indicar la razón de la censura");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await managePost({
        token,
        action,
        postId: post.id,
        complexId,
        reason: action === "CENSOR_POST" ? censorReason : undefined,
      });
      resetState();
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al gestionar el post");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setCensorReason("");
    setConfirmDelete(false);
    setError("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const actions: {
    action: PostAction;
    label: string;
    icon: React.ElementType;
    variant: string;
    show: boolean;
  }[] = [
    {
      action: "PIN_POST",
      label: "Fijar publicación",
      icon: Pin,
      variant:
        "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
      show: !post.isPinned,
    },
    {
      action: "UNPIN_POST",
      label: "Desfijar publicación",
      icon: PinOff,
      variant:
        "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200",
      show: post.isPinned,
    },
    {
      action: "CENSOR_POST",
      label: "Censurar publicación",
      icon: EyeOff,
      variant:
        "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
      show: !post.isCensored,
    },
    {
      action: "UNCENSOR_POST",
      label: "Quitar censura",
      icon: Eye,
      variant:
        "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200",
      show: post.isCensored,
    },
    {
      action: "DELETE_POST",
      label: confirmDelete ? "Confirmar eliminación" : "Eliminar publicación",
      icon: Trash2,
      variant: confirmDelete
        ? "bg-red-600 text-white hover:bg-red-700"
        : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
      show: true,
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">
            Gestionar Publicación
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Post preview */}
        <div className="p-4 border-b bg-slate-50">
          <p className="text-sm text-slate-700 line-clamp-3">{post.content}</p>
          <p className="text-xs text-slate-400 mt-2">
            Por {post.author?.name || "Desconocido"} •{" "}
            {new Date(post.createdAt).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="p-4 space-y-3">
          {/* Censor reason input */}
          {!post.isCensored && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Razón de censura (requerido para censurar)
              </label>
              <input
                type="text"
                value={censorReason}
                onChange={(e) => setCensorReason(e.target.value)}
                placeholder="Ej: Contenido inapropiado, spam..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Delete confirmation warning */}
          {confirmDelete && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">
                  ¿Estás seguro?
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Esta acción eliminará la publicación, sus comentarios y
                  reacciones permanentemente.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {actions
            .filter((a) => a.show)
            .map(({ action, label, icon: Icon, variant }) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                disabled={loading}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition disabled:opacity-50 ${variant}`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                {label}
              </button>
            ))}

          {/* Cancel delete confirmation */}
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
