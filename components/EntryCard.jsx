'use client';
import { useEffect, useRef, useState } from 'react';
import { money, thaiDate } from '../lib/format';
import { X, Check, GripVertical } from 'lucide-react';

const BRANCH_STYLE = {
  Suriwong: 'bg-teal-soft text-teal',
  'The Kannas': 'bg-amber-soft text-amber',
};

export default function EntryCard({ entry, index, onClick, onDelete, showDate, dragHandleProps, isDragging }) {
  const branchClass = BRANCH_STYLE[entry.branch?.name] || 'bg-primary-soft text-primary-dark';
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function askDelete(e) {
    e.stopPropagation();
    setConfirming(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setConfirming(false), 3000);
  }

  function confirmDelete(e) {
    e.stopPropagation();
    clearTimeout(timerRef.current);
    setConfirming(false);
    onDelete(entry);
  }

  function cancelDelete(e) {
    e.stopPropagation();
    clearTimeout(timerRef.current);
    setConfirming(false);
  }

  return (
    <div
      onClick={() => !confirming && !isDragging && onClick && onClick(entry)}
      className={`rounded-2xl border bg-white p-3.5 flex items-stretch gap-2 cursor-pointer transition-shadow ${
        isDragging ? 'border-primary shadow-lg' : 'border-line active:bg-primary-soft/40'
      }`}
    >
      {dragHandleProps && (
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={dragHandleProps.onPointerDown}
          className="flex-none -ml-1 flex items-center justify-center w-7 text-ink-faint/70 active:text-primary cursor-grab select-none"
          style={{ touchAction: 'none' }}
          aria-label="กดค้างเพื่อลากสลับตำแหน่ง"
        >
          <GripVertical size={18} />
        </button>
      )}

      <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-ink-faint mb-1.5">
            {typeof index === 'number' && (
              <span className="font-semibold text-ink-soft">รายการที่ {index + 1}</span>
            )}
            {showDate && <span>{thaiDate(entry.entryDate)}</span>}
            {entry.startTime && <span>{entry.startTime} น.</span>}
            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${branchClass}`}>
              {entry.branch?.name}
            </span>
          </div>

          <p className="font-semibold text-[15px] text-ink leading-snug">{entry.service?.name}</p>

          {(entry.addons?.length > 0 || entry.customAmount > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {entry.addons?.map((a) => (
                <span
                  key={a.id}
                  className="text-[11px] bg-gold-soft text-gold font-semibold px-2 py-0.5 rounded-full"
                >
                  + {a.service?.name}
                </span>
              ))}
              {entry.customAmount > 0 && (
                <span className="text-[11px] bg-gold-soft text-gold font-semibold px-2 py-0.5 rounded-full">
                  + {entry.customLabel || 'อื่นๆ'} ({entry.customAmount}฿)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="text-right flex-none flex flex-col items-end gap-1.5">
          <p className="font-extrabold text-lg text-primary-dark tabular-nums whitespace-nowrap">
            {money(entry.commission)}
          </p>
          {onDelete && (
            confirming ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={confirmDelete}
                  className="flex items-center gap-1 rounded-full bg-red-500 text-white text-[11px] font-bold pl-2 pr-2.5 py-1 tap-target"
                >
                  <Check size={13} /> ลบเลย
                </button>
                <button
                  onClick={cancelDelete}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-line text-ink-faint tap-target"
                  aria-label="ยกเลิกการลบ"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={askDelete}
                className="text-red-500/80 p-1 -mr-1"
                aria-label="ลบรายการนี้"
              >
                <X size={16} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}