import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Safety confirmation dialog modal for destructive operations
export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-5 border border-zinc-200 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{message}</p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5"
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
