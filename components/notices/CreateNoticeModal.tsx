'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { closeForm } from '@/store/slices/noticesSlice';
import { NoticeForm } from './NoticeForm';
import { NoticePreview } from './NoticePreview';
import { X } from 'lucide-react';

interface CreateNoticeModalProps {
  token: string;
  complexId: string;
}

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  token,
  complexId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isShowingForm, isShowingPreview } = useSelector(
    (state: RootState) => state.notices
  );

  const isOpen = isShowingForm || isShowingPreview;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {isShowingPreview ? 'Previsualizar Aviso' : 'Crear Nuevo Aviso'}
          </h2>
          <button
            onClick={() => dispatch(closeForm())}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isShowingPreview ? (
            <NoticePreview token={token} complexId={complexId} />
          ) : (
            <NoticeForm token={token} complexId={complexId} />
          )}
        </div>
      </div>
    </div>
  );
};
