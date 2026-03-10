'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  hidePreview,
  setCreatingNotice,
  setCreateNoticeError,
  setSuccessMessage,
  prependNotice,
  closeForm,
} from '@/store/slices/noticesSlice';
import { createNotice } from '@/services/notices.service';
import {
  IAdminNoticesRequestBody,
  NOTICE_TYPE_LABELS,
  NOTICE_TYPE_COLORS,
} from '@/app/dashboard/notices/notices.types';
import { useCallback } from 'react';

interface NoticePreviewProps {
  token: string;
  complexId: string;
}

export const NoticePreview: React.FC<NoticePreviewProps> = ({
  token,
  complexId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { formData, blocks, apartments, isCreating, errorCreating } = useSelector(
    (state: RootState) => state.notices
  );

  // Get target name for display
  const getTargetName = useCallback(() => {
    if (formData.scope === 'GLOBAL') {
      return 'Todos';
    }
    if (formData.scope === 'BLOCK') {
      const block = blocks.find((b) => b.id === formData.target_id);
      return block ? block.name : 'Bloque no encontrado';
    }
    if (formData.scope === 'UNIT') {
      const apt = apartments.find((a) => a.id === formData.target_id);
      return apt ? apt.full_label || `${apt.block_name} - Apto ${apt.number}` : 'Apartamento no encontrado';
    }
    return '';
  }, [formData, blocks, apartments]);

  const handleConfirmSend = async () => {
    dispatch(setCreatingNotice(true));

    try {
      const payload: IAdminNoticesRequestBody = {
        action: 'CREATE_NOTICE',
        payload: {
          scope: formData.scope,
          target_id: formData.target_id,
          type: formData.type,
          title: formData.title,
          message: formData.message,
        },
      };

      const result = await createNotice({
        token,
        complexId,
        payload,
      });

      if (result.error) {
        dispatch(setCreateNoticeError(result.error));
        return;
      }

      // Success: create a local notice object to prepend to list
      const newNotice = {
        id: result.notice_id || '',
        complex_id: complexId,
        scope: formData.scope,
        target_id: formData.target_id,
        type: formData.type,
        title: formData.title,
        message: formData.message,
        created_at: new Date().toISOString(),
        target_name: getTargetName(),
      };

      dispatch(prependNotice(newNotice));
      dispatch(setSuccessMessage('Aviso creado exitosamente'));
      dispatch(closeForm());

      // Clear success message after 3 seconds
      setTimeout(() => {
        dispatch(setSuccessMessage(null));
      }, 3000);
    } catch (error) {
      dispatch(
        setCreateNoticeError(
          error instanceof Error ? error.message : 'Error desconocido'
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
        {/* Tipo Badge */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${
              NOTICE_TYPE_COLORS[formData.type]
            }`}
          >
            {NOTICE_TYPE_LABELS[formData.type]}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {formData.title}
        </h3>

        {/* Mensaje */}
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">
          {formData.message}
        </p>

        {/* Destinatario */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Destinatario:</span> {getTargetName()}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-semibold">Créado:</span>{' '}
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorCreating && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorCreating}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          onClick={() => dispatch(hidePreview())}
          disabled={isCreating}
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Volver a editar
        </button>
        <button
          onClick={handleConfirmSend}
          disabled={isCreating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Aviso'
          )}
        </button>
      </div>
    </div>
  );
};
