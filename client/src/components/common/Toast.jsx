import React from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

// Toast alert notification component
export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'success', message } = toast;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200/90 bg-white text-zinc-900 shadow-md text-xs font-medium">
        <div className="flex-shrink-0">
          {isSuccess && <Check className="w-4 h-4 text-emerald-600" strokeWidth={2} />}
          {isError && <AlertCircle className="w-4 h-4 text-rose-600" strokeWidth={2} />}
          {!isSuccess && !isError && <Info className="w-4 h-4 text-zinc-600" strokeWidth={2} />}
        </div>
        <div className="flex-1 leading-snug">{message}</div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-colors"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
