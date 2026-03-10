'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  setNoticesLoading,
  setNotices,
  appendNotices,
  setNoticesError,
} from '@/store/slices/noticesSlice';
import { fetchNotices } from '@/services/notices.service';
import {
  NOTICE_TYPE_LABELS,
  NOTICE_TYPE_COLORS,
} from '@/app/dashboard/notices/notices.types';
import { useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface NoticesListProps {
  token: string;
  complexId: string;
}

export const NoticesList: React.FC<NoticesListProps> = ({
  token,
  complexId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { notices, nextCursor, isLoadingNotices, errorNotices } = useSelector(
    (state: RootState) => state.notices
  );

  // Define loadNotices first before using it in useEffect
  const loadNotices = useCallback(
    (cursor?: string | null) => {
      dispatch(setNoticesLoading(true));
      const isLoadMore = !!cursor;

      const loadData = async () => {
        try {
          const result = await fetchNotices({
            token,
            complexId,
            options: {
              limit: 20,
              cursor: cursor || undefined,
              order: 'desc',
            },
          });

          if (result.error) {
            dispatch(setNoticesError(result.error));
            return;
          }

          if (isLoadMore) {
            dispatch(
              appendNotices({
                notices: result.notices,
                nextCursor: result.nextCursor,
              })
            );
          } else {
            dispatch(
              setNotices({
                notices: result.notices,
                nextCursor: result.nextCursor,
              })
            );
          }
        } catch (error) {
          dispatch(
            setNoticesError(
              error instanceof Error ? error.message : 'Unknown error'
            )
          );
        }
      };

      loadData();
    },
    [dispatch, token, complexId]
  );

  // Initial load
  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleLoadMore = () => {
    if (nextCursor) {
      loadNotices(nextCursor);
    }
  };

  if (isLoadingNotices && notices.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (errorNotices && notices.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{errorNotices}</p>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay avisos registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabla de avisos */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Destinatario
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notices.map((notice) => (
              <tr key={notice.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${
                      NOTICE_TYPE_COLORS[notice.type]
                    }`}
                  >
                    {NOTICE_TYPE_LABELS[notice.type]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 truncate">
                    {notice.title}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {notice.target_name || 'Todos'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(notice.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {nextCursor && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingNotices}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoadingNotices ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Cargar más
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
