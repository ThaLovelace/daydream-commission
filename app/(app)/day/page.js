'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import EntryForm from '../../../components/EntryForm';
import EntryCard from '../../../components/EntryCard';
import { money, todayStr, pad } from '../../../lib/format';

export default function DayPage() {
  const [userId, setUserId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [undo, setUndo] = useState(null); // { payload, label }
  const undoTimerRef = useRef(null);

  useEffect(() => {
    fetch('/api/session').then((r) => r.json()).then((d) => setUserId(d.user?.id || null));
    fetch('/api/services').then((r) => r.json()).then((d) => {
      setBranches(d.branches || []);
      setServices(d.services || []);
    });
  }, []);

  const loadEntries = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/entries?userId=${userId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .finally(() => setLoading(false));
  }, [userId, date]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

  function shiftDay(delta) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setEditingEntry(null);
    setUndo(null);
  }

  async function handleSave(payload) {
    if (editingEntry) {
      await fetch(`/api/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setEditingEntry(null);
    } else {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userId, entryDate: date }),
      });
    }
    loadEntries();
  }

  async function handleDelete(entry) {
    // EntryCard ยืนยันการลบมาให้แล้ว (แตะสองครั้ง) — ตรงนี้ลบได้เลย ไม่ต้องเด้งป็อปอัพซ้ำ
    if (editingEntry?.id === entry.id) setEditingEntry(null);
    await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });

    // เก็บข้อมูลไว้เผื่อกด "เลิกทำ" — ลบผิดแล้วกู้คืนได้ทันทีโดยไม่ต้องพิมพ์ใหม่ทั้งหมด
    clearTimeout(undoTimerRef.current);
    setUndo({
      label: entry.service?.name || 'รายการ',
      payload: {
        branchId: entry.branchId,
        serviceId: entry.serviceId,
        addonIds: entry.addons?.map((a) => a.serviceId) || [],
        customAmount: entry.customAmount || 0,
        customLabel: entry.customLabel || null,
        startTime: entry.startTime || null,
      },
    });
    undoTimerRef.current = setTimeout(() => setUndo(null), 6000);

    loadEntries();
  }

  async function handleUndo() {
    if (!undo) return;
    clearTimeout(undoTimerRef.current);
    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...undo.payload, userId, entryDate: date }),
    });
    setUndo(null);
    loadEntries();
  }

  // "main" คือแพ็คหลัก 1-5, "special" คือรายการหลักเดี่ยวอื่นๆ (สระผม/นวดตัว/นวดศีรษะ/นวดเท้า)
  // ทั้งสองหมวดนี้เลือกเป็น "บริการหลัก" ของรายการได้เหมือนกัน ต่างจาก "addon" ที่บวกเพิ่มทีหลัง
  const mainServices = services.filter((s) => s.category === 'main' || s.category === 'special');
  const addonServices = services.filter((s) => s.category === 'addon');
  const total = entries.reduce((s, e) => s + e.commission, 0);

  if (!userId || branches.length === 0) {
    return <p className="text-center text-ink-faint py-10 text-sm">กำลังโหลด...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-line p-2.5 flex items-center gap-2 shadow-card">
        <button onClick={() => shiftDay(-1)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-line tap-target">
          <ChevronLeft size={18} />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setEditingEntry(null); setUndo(null); }}
          className="flex-1 text-center rounded-xl border border-line py-2.5 text-sm tap-target"
        />
        <button onClick={() => shiftDay(1)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-line tap-target">
          <ChevronRight size={18} />
        </button>
      </div>

      <EntryForm
        branches={branches}
        mainServices={mainServices}
        addonServices={addonServices}
        editingEntry={editingEntry}
        onSave={handleSave}
        onCancelEdit={() => setEditingEntry(null)}
        nextCustomerNo={entries.length + 1}
      />

      <div>
        <div className="flex items-center justify-between mb-0.5 px-0.5">
          <h2 className="font-bold text-primary-dark text-[15px]">รายการวันนี้</h2>
          <span className="text-xs text-ink-faint">แตะรายการเพื่อแก้ไข</span>
        </div>
        {entries.length > 1 && (
          <p className="text-[11px] text-ink-faint px-0.5 mb-2">
            ลบรายการไหนก็ได้อย่างอิสระ ไม่ต้องลบทั้งหมดแล้วพิมพ์ใหม่ — ลำดับเลขจะเรียงให้เองอัตโนมัติ
          </p>
        )}

        {loading ? (
          <p className="text-center text-ink-faint py-8 text-sm">กำลังโหลด...</p>
        ) : entries.length === 0 ? (
          <div className="text-center text-ink-faint py-10 text-sm bg-white rounded-2xl border border-dashed border-line">
            ยังไม่มีรายการของวันนี้
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e, i) => (
              <EntryCard
                key={e.id}
                entry={e}
                index={i}
                onClick={setEditingEntry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {undo && (
          <div className="flex items-center justify-between rounded-2xl bg-ink text-white px-4 py-3 mt-2.5 text-sm">
            <span className="opacity-90">ลบ &ldquo;{undo.label}&rdquo; แล้ว</span>
            <button onClick={handleUndo} className="flex items-center gap-1 font-bold underline tap-target">
              <RotateCcw size={14} /> เลิกทำ
            </button>
          </div>
        )}

        {entries.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-primary-dark text-white px-5 py-4 mt-3">
            <span className="text-sm opacity-85 font-semibold">รวมค่าคอมวันนี้</span>
            <span className="text-2xl font-extrabold tabular-nums">{money(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}