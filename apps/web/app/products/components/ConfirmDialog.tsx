'use client';
import { useEffect } from 'react';

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({ open, title = 'Are you sure?', message, onConfirm, onClose }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-2">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="rounded-lg bg-red-600 px-3 py-2 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}