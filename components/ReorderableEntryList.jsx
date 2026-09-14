'use client';
import { useRef, useState, useCallback } from 'react';
import EntryCard from './EntryCard';

// กดค้างที่ไอคอนลาก (⠿) นานเท่านี้ก่อนจะเริ่มลาก — กันสลับตำแหน่งพลาดตอนแค่แตะเฉย ๆ
const LONG_PRESS_MS = 260;
// ถ้าขยับนิ้วเกินนี้ก่อนครบเวลากดค้าง ถือว่าไม่ได้ตั้งใจลาก (เช่นมือสั่นตอนแตะ)
const MOVE_CANCEL_PX = 6;

export default function ReorderableEntryList({ entries, onClick, onDelete, onReorder }) {
  const [dragId, setDragId] = useState(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);

  const itemRefs = useRef(new Map());
  // ค่าที่ไม่ต้อง re-render ทุกครั้งที่เปลี่ยน เก็บไว้ใน ref ตลอดช่วงลากหนึ่งครั้ง
  const dragInfo = useRef(null); // { startIndex, startY, rects: Map<id, {top, height}> }
  const longPressTimer = useRef(null);
  const movedBeforeHold = useRef(false);

  const setItemRef = useCallback((id) => (el) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  function captureRects() {
    const rects = new Map();
    entries.forEach((e) => {
      const el = itemRefs.current.get(e.id);
      if (el) {
        const r = el.getBoundingClientRect();
        rects.set(e.id, { top: r.top, height: r.height });
      }
    });
    return rects;
  }

  function beginDrag(index, clientY) {
    dragInfo.current = { startIndex: index, startY: clientY, rects: captureRects() };
    setDragId(entries[index].id);
    setDragDeltaY(0);
    setHoverIndex(index);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
  }

  function updateDrag(clientY) {
    const info = dragInfo.current;
    if (!info) return;
    const deltaY = clientY - info.startY;
    setDragDeltaY(deltaY);

    const draggedRect = info.rects.get(entries[info.startIndex].id);
    if (!draggedRect) return;
    const draggedCenter = draggedRect.top + draggedRect.height / 2 + deltaY;

    // เทียบจุดกึ่งกลางของรายการที่ลากอยู่ กับตำแหน่งเดิมของรายการอื่น ๆ ตอนเริ่มลาก
    let target = 0;
    for (let i = 0; i < entries.length; i++) {
      const r = info.rects.get(entries[i].id);
      if (!r) continue;
      const center = r.top + r.height / 2;
      if (draggedCenter > center) target = i + 1;
    }
    target = Math.max(0, Math.min(entries.length - 1, target));
    setHoverIndex(target);
  }

  function finishDrag() {
    const info = dragInfo.current;
    if (info) {
      const to = hoverIndex ?? info.startIndex;
      if (to !== info.startIndex) {
        const next = entries.slice();
        const [moved] = next.splice(info.startIndex, 1);
        next.splice(to, 0, moved);
        onReorder(next.map((e) => e.id));
      }
    }
    dragInfo.current = null;
    setDragId(null);
    setDragDeltaY(0);
    setHoverIndex(null);
  }

  function handlePointerDown(index) {
    return (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;
      movedBeforeHold.current = false;
      clearTimeout(longPressTimer.current);

      longPressTimer.current = setTimeout(() => {
        if (!movedBeforeHold.current) beginDrag(index, startY);
      }, LONG_PRESS_MS);

      function onMove(ev) {
        if (!dragInfo.current) {
          const dx = Math.abs(ev.clientX - startX);
          const dy = Math.abs(ev.clientY - startY);
          if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
            movedBeforeHold.current = true;
            clearTimeout(longPressTimer.current);
          }
          return;
        }
        ev.preventDefault();
        updateDrag(ev.clientY);
      }

      function onUp() {
        clearTimeout(longPressTimer.current);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        finishDrag();
      }

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };
  }

  const info = dragInfo.current;

  return (
    <div className="space-y-2.5">
      {entries.map((entry, index) => {
        const isDragging = dragId === entry.id;
        let shiftY = 0;

        if (info && !isDragging && hoverIndex != null) {
          const draggedRect = info.rects.get(entries[info.startIndex].id);
          const gap = 10; // ต้องตรงกับ space-y-2.5 (0.625rem = 10px)
          const h = draggedRect ? draggedRect.height + gap : 0;
          if (info.startIndex < hoverIndex && index > info.startIndex && index <= hoverIndex) {
            shiftY = -h;
          } else if (info.startIndex > hoverIndex && index >= hoverIndex && index < info.startIndex) {
            shiftY = h;
          }
        }

        return (
          <div
            key={entry.id}
            ref={setItemRef(entry.id)}
            style={{
              position: 'relative',
              zIndex: isDragging ? 30 : 1,
              transform: isDragging ? `translateY(${dragDeltaY}px) scale(1.02)` : `translateY(${shiftY}px)`,
              transition: isDragging ? 'none' : 'transform 160ms ease',
            }}
          >
            <EntryCard
              entry={entry}
              index={index}
              onClick={onClick}
              onDelete={onDelete}
              isDragging={isDragging}
              dragHandleProps={{ onPointerDown: handlePointerDown(index) }}
            />
          </div>
        );
      })}
    </div>
  );
}
