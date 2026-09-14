'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Plus, CheckCircle2 } from 'lucide-react';
import EntryForm from '../../../components/EntryForm';
import ReorderableEntryList from '../../../components/ReorderableEntryList';
import Modal from '../../../components/Modal';
import { money, todayStr, pad } from '../../../lib/format';

export default function DayPage() {
  const [userId, setUserId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [undo, setUndo] = useState(null); // { payload, label }
  const [savedToast, setSavedToast] = useState(null); // { label, mode: 'add' | 'edit' }
  const undoTimerRef = useRef(null);
  const savedTimerRef = useRef(null);

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
  useEffect(() => () => {
    clearTimeout(undoTimerRef.current);
    clearTimeout(savedTimerRef.current);
  }, []);

  function shiftDay(delta) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    closeForm();
    setUndo(null);
    setSavedToast(null);
  }

  function openAddForm() {
    setEditingEntry(null);
    setShowForm(true);
  }

  function openEditForm(entry) {
    setEditingEntry(entry);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingEntry(null);
  }

  async function handleSave(payload) {
    const isEdit = !!editingEntry;
    if (isEdit) {
      await fetch(`/api/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userId, entryDate: date }),
      });
    }

    // แจ้งชัดเจนว่าเพิ่ม/แก้ไขอะไรไปแล้ว แทนที่จะปิดฟอร์มเงียบ ๆ
    const svc = services.find((s) => s.id === payload.serviceId);
    clearTimeout(savedTimerRef.current);
    setUndo(null);
    setSavedToast({ label: svc?.name || 'รายการ', mode: isEdit ? 'edit' : 'add' });
    savedTimerRef.current = setTimeout(() => setSavedToast(null), 2600);

    closeForm();
    loadEntries();
  }

  async function handleDelete(entry) {
    // EntryCard ยืนยันการลบมาให้แล้ว (แตะสองครั้ง) — ตรงนี้ลบได้เลย ไม่ต้องเด้งป็อปอัพซ้ำ
    if (editingEntry?.id === entry.id) closeForm();
    await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });

    clearTimeout(savedTimerRef.current);
    setSavedToast(null);

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

  // ลากสลับตำแหน่งในลิส: อัปเดตหน้าจอทันที (optimistic) แล้วค่อยบันทึกลำดับใหม่ลง DB เบื้องหลัง
  async function handleReorder(orderedIds) {
    const prevEntries = entries;
    const byId = new Map(entries.map((e) => [e.id, e]));
    const next = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    setEntries(next);
    try {
      await fetch('/api/entries/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, entryDate: date, orderedIds }),
      });
    } catch {
      setEntries(prevEntries); // เซฟไม่สำเร็จ ย้อนกลับลำดับเดิม
    }
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
          onChange={(e) => { setDate(e.target.value); closeForm(); setUndo(null); setSavedToast(null); }}
          className="flex-1 text-center rounded-xl border border-line py-2.5 text-sm tap-target"
        />
        <button onClick={() => shiftDay(1)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-line tap-target">
          <ChevronRight size={18} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-0.5 px-0.5">
          <h2 className="font-bold text-primary-dark text-[15px]">
            รายการวันนี้{entries.length > 0 ? ` (${entries.length})` : ''}
          </h2>
          {entries.length > 0 && (
            <button
              onClick={openAddForm}
              className="flex items-center gap-1 bg-primary text-white text-xs font-bold pl-2.5 pr-3 py-2 rounded-full tap-target"
            >
              <Plus size={14} /> เพิ่มรายการ
            </button>
          )}
        </div>
        {entries.length > 1 && (
          <p className="text-[11px] text-ink-faint px-0.5 mb-2">
            แตะรายการเพื่อแก้ไข · กดค้างที่ไอคอน ⠿ เพื่อลากสลับตำแหน่ง · ลบรายการไหนก็ได้อย่างอิสระ ลำดับเลขจะเรียงให้เองอัตโนมัติ
          </p>
        )}

        {loading ? (
          <p className="text-center text-ink-faint py-8 text-sm">กำลังโหลด...</p>
        ) : entries.length === 0 ? (
          <button
            onClick={openAddForm}
            className="w-full flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-primary/30 bg-white py-12 tap-target active:bg-primary-soft/30"
          >
            <span className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center">
              <Plus size={26} />
            </span>
            <span className="font-bold text-[15px] text-primary-dark">เพิ่มรายการแรกของวันนี้</span>
            <span className="text-xs text-ink-faint">แตะเพื่อเริ่มบันทึกค่าคอม</span>
          </button>
        ) : (
          <ReorderableEntryList
            entries={entries}
            onClick={openEditForm}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}

        {undo && (
          <div className="flex items-center justify-between rounded-2xl bg-ink text-white px-4 py-3 mt-2.5 text-sm">
            <span className="opacity-90">ลบ &ldquo;{undo.label}&rdquo; แล้ว</span>
            <button onClick={handleUndo} className="flex items-center gap-1 font-bold underline tap-target">
              <RotateCcw size={14} /> เลิกทำ
            </button>
          </div>
        )}

        {savedToast && (
          <div className="flex items-center gap-2 rounded-2xl bg-primary-dark text-white px-4 py-3 mt-2.5 text-sm">
            <CheckCircle2 size={16} className="flex-none opacity-90" />
            <span className="opacity-90">
              {savedToast.mode === 'edit'
                ? <>บันทึกการแก้ไข &ldquo;{savedToast.label}&rdquo; แล้ว</>
                : <>เพิ่ม &ldquo;{savedToast.label}&rdquo; แล้ว</>}
            </span>
          </div>
        )}

        {entries.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-primary-dark text-white px-5 py-4 mt-3">
            <span className="text-sm opacity-85 font-semibold">รวมค่าคอมวันนี้</span>
            <span className="text-2xl font-extrabold tabular-nums">{money(total)}</span>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={closeForm} title={editingEntry ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}>
        <EntryForm
          branches={branches}
          mainServices={mainServices}
          addonServices={addonServices}
          editingEntry={editingEntry}
          onSave={handleSave}
          nextCustomerNo={entries.length + 1}
        />
      </Modal>
    </div>
  );
}
