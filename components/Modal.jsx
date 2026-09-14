'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md sm:mx-4 bg-[#eef1f7] rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto animate-slide-up shadow-card">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 bg-[#eef1f7]/95 backdrop-blur border-b border-line">
          <h2 className="font-bold text-primary-dark text-[15px]">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink-faint active:bg-primary-soft tap-target"
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
