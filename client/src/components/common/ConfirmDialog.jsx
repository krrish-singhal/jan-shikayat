import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal.jsx';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
  loading = false,
}) => {
  const { t } = useTranslation('common');
  const resolvedTitle = title || t('confirmAction', 'Confirm Action');
  const resolvedConfirmText = confirmText || t('confirm', 'Confirm');
  const resolvedCancelText = cancelText || t('cancel', 'Cancel');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resolvedTitle} maxWidth="max-w-md">
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`p-3 rounded-full shrink-0 ${
            isDanger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          {isDanger ? <AlertCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="civic-btn-secondary"
        >
          {resolvedCancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={isDanger ? 'civic-btn-danger' : 'civic-btn-primary'}
        >
          {loading ? t('processing', 'Processing...') : resolvedConfirmText}
        </button>
      </div>
    </Modal>
  );
};
