'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { openForm } from '@/store/slices/noticesSlice';
import { NoticesList } from '@/components/notices/NoticesList';
import { CreateNoticeModal } from '@/components/notices/CreateNoticeModal';
import { Plus, AlertCircle } from 'lucide-react';

export default function NoticesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const activeComplex = useAppSelector((state) => state.complex.activeComplex);
  const token = useAppSelector((state) => state.auth.token);
  const { successMessage } = useAppSelector((state) => state.notices);

  const complexId = activeComplex?.id;

  // Validación de permisos/autenticación
  useEffect(() => {
    if (!complexId || !token) {
      // Redirigir al login o mostrar error
      console.warn('No active complex or authentication token');
    }
  }, [complexId, token]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avisos y Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            Crea y gestiona avisos informativos para tu comunidad
          </p>
        </div>
        <button
          onClick={() => dispatch(openForm())}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Nuevo Aviso
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Notices List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <NoticesList token={token} complexId={complexId} />
        </div>
      </div>

      {/* Modal */}
      <CreateNoticeModal token={token} complexId={complexId} />
    </div>
  );
}
