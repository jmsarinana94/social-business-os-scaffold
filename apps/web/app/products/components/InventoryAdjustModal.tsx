'use client';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdjust: (delta: number) => Promise<void> | void;
};

export default function InventoryAdjustModal({ open, onClose, onAdjust }: Props) {
  const [delta, setDelta] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setDelta(0); }, [open]);

  if (!open) return null;

  async function submit() {
    try {
      setBusy(true);
      await onAdjust(delta);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Adjust Inventory</h3>
        <p className="text-sm text-gray-600 mb-4">Enter a positive or negative number.</p>
        <input
          type="number"
          className="w-full rounded-lg border px-3 py-2 mb-4"
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-2">Cancel</button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}