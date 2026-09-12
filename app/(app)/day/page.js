'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  function shiftDay(delta) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setEditingEntry(null);
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
    if (!confirm('ลบรายการนี้?')) return;
    await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
    if (editingEntry?.id === entry.id) setEditingEntry(null);
    loadEntries();
  }

  const mainServices = services.filter((s) => s.category === 'main');
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
          onChange={(e) => { setDate(e.target.value); setEditingEntry(null); }}
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
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="font-bold text-primary-dark text-[15px]">รายการวันนี้</h2>
          <span className="text-xs text-ink-faint">แตะรายการเพื่อแก้ไข</span>
        </div>

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
