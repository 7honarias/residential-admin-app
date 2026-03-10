'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  updateFormData,
  showPreview,
  closeForm,
  setBlocksLoading,
  setBlocks,
  setApartmentsLoading,
  setApartments,
} from '@/store/slices/noticesSlice';
import { fetchBlocks, fetchApartmentsForNotices } from '@/services/notices.service';
import {
  NoticeType,
  NoticeScope,
  NOTICE_TYPE_LABELS,
  NOTICE_SCOPE_LABELS,
} from '@/app/dashboard/notices/notices.types';
import { useEffect } from 'react';

interface NoticeFormProps {
  token: string;
  complexId: string;
}

export const NoticeForm: React.FC<NoticeFormProps> = ({ token, complexId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, blocks, apartments } = useSelector(
    (state: RootState) => state.notices
  );

  const noticeTypes: NoticeType[] = ['INFO', 'WARNING', 'ALERT'];
  const scopes: NoticeScope[] = ['GLOBAL', 'BLOCK', 'UNIT'];

  // Load blocks when scope changes to BLOCK
  useEffect(() => {
    if (formData.scope === 'BLOCK') {
      const loadBlocks = async () => {
        dispatch(setBlocksLoading(true));
        const data = await fetchBlocks(token, complexId);
        dispatch(setBlocks(data));
      };
      loadBlocks();
    }
  }, [formData.scope, dispatch, token, complexId]);

  // Load apartments when scope changes to UNIT
  useEffect(() => {
    if (formData.scope === 'UNIT') {
      const loadApartments = async () => {
        dispatch(setApartmentsLoading(true));
        const data = await fetchApartmentsForNotices(token, complexId);
        dispatch(setApartments(data));
      };
      loadApartments();
    }
  }, [formData.scope, dispatch, token, complexId]);

  const isFormValid = () => {
    const titleValid = formData.title.trim().length > 0;
    const messageValid = formData.message.trim().length > 0;
    const targetValid =
      formData.scope === 'GLOBAL' || (formData.target_id !== null && formData.target_id !== '');
    return titleValid && messageValid && targetValid;
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            dispatch(updateFormData({ title: e.target.value }))
          }
          placeholder="Ej: Mantenimiento próximo"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Mensaje */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mensaje *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            dispatch(updateFormData({ message: e.target.value }))
          }
          placeholder="Ej: Se realizará mantenimiento en las zonas comunes..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {/* Prioridad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prioridad *
        </label>
        <select
          value={formData.type}
          onChange={(e) =>
            dispatch(updateFormData({ type: e.target.value as NoticeType }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {noticeTypes.map((type) => (
            <option key={type} value={type}>
              {NOTICE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Segmentación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Segmentación *
        </label>
        <select
          value={formData.scope}
          onChange={(e) => {
            dispatch(
              updateFormData({
                scope: e.target.value as NoticeScope,
                target_id: null,
              })
            );
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {scopes.map((scope) => (
            <option key={scope} value={scope}>
              {NOTICE_SCOPE_LABELS[scope]}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Bloque (si scope = BLOCK) */}
      {formData.scope === 'BLOCK' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecciona Bloque/Torre *
          </label>
          <select
            value={formData.target_id || ''}
            onChange={(e) =>
              dispatch(updateFormData({ target_id: e.target.value || null }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">-- Selecciona un bloque --</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selector de Apartamento (si scope = UNIT) */}
      {formData.scope === 'UNIT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecciona Apartamento *
          </label>
          <select
            value={formData.target_id || ''}
            onChange={(e) =>
              dispatch(updateFormData({ target_id: e.target.value || null }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">-- Selecciona un apartamento --</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                {apt.full_label || `${apt.block_name} - Apto ${apt.number}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          onClick={() => dispatch(closeForm())}
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => dispatch(showPreview())}
          disabled={!isFormValid()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Previsualizar
        </button>
      </div>
    </div>
  );
};
