'use client';
import { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

function EditableRow({ service, prefix, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(service.price));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startEdit() {
    setValue(String(service.price));
    setError('');
    setEditing(true);
  }

  async function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      setError('ใส่ตัวเลขให้ถูกต้อง');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: n }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'บันทึกไม่สำเร็จ');
        setSaving(false);
        return;
      }
      onSaved(data.service);
      setEditing(false);
    } catch {
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
    setSaving(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 text-sm py-1">
        <span className="flex-1 min-w-0">{service.name}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-20 rounded-lg border border-primary px-2 py-1.5 text-sm text-right tabular-nums tap-target"
        />
        <span className="text-ink-faint">฿</span>
        <button
          onClick={save}
          disabled={saving}
          aria-label="บันทึก"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white flex-none"
        >
          <Check size={15} />
        </button>
        <button
          onClick={() => setEditing(false)}
          aria-label="ยกเลิก"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-line flex-none"
        >
          <X size={15} />
        </button>
        {error && <span className="basis-full text-[11px] text-red-500 mt-0.5">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm py-1 group">
      <span>{service.name}</span>
      <button onClick={startEdit} className="flex items-center gap-2 tap-target -mr-1 px-1">
        <span className="font-semibold tabular-nums">{prefix}{service.price}฿</span>
        <Pencil size={13} className="text-ink-faint" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [userId, setUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/session').then((r) => r.json()).then((d) => setUserId(d.user?.id || null));
    fetch('/api/users').then((r) => r.json()).then((d) => setUsers(d.users || []));
    fetch('/api/services').then((r) => r.json()).then((d) => setServices(d.services || []));
  }, []);

  async function addUser() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.user) {
      setUsers((u) => [...u, data.user]);
      setNewName('');
    }
  }

  function handleSaved(updated) {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  // จัดกลุ่ม: แพ็คหลัก 1-4 ก่อน แล้วตามด้วยรายการหลักอื่น ๆ แล้วค่อยรายการเสริม
  const mainServices = services.filter((s) => s.category === 'main');
  const packServices = mainServices.filter((s) => s.sortOrder < 4);
  const otherMainServices = mainServices.filter((s) => s.sortOrder >= 4);
  const addonServices = services.filter((s) => s.category === 'addon');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-line p-4 shadow-card">
        <h2 className="font-bold text-primary-dark text-[15px] mb-3">ผู้ใช้ในระบบ</h2>
        <div className="space-y-2 mb-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm border-b border-line/70 py-2 last:border-0">
              <span className="font-medium">{u.name}</span>
              {u.id === userId && (
                <span className="text-[10.5px] bg-primary-soft text-primary-dark font-bold px-2 py-0.5 rounded-full">คุณ</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="เพิ่มชื่อช่างใหม่"
            className="flex-1 rounded-xl border border-line px-3 py-2.5 text-sm tap-target"
          />
          <button onClick={addUser} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold bg-white tap-target">
            เพิ่ม
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-line p-4 shadow-card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-primary-dark text-[15px]">อัตราค่าคอม (ของช่าง)</h2>
        </div>
        <p className="text-[11px] text-ink-faint mb-3">
          แตะที่ตัวเลขเพื่อแก้ไขราคาได้เลย — รายการที่บันทึกไปแล้วในอดีตจะไม่เปลี่ยนย้อนหลัง
        </p>

        <p className="text-[11px] font-bold text-primary uppercase mb-1.5">แพ็คหลัก 1–4</p>
        <div className="divide-y divide-line/60 mb-3">
          {packServices.map((s) => (
            <EditableRow key={s.id} service={s} prefix="" onSaved={handleSaved} />
          ))}
        </div>

        <p className="text-[11px] font-bold text-ink-soft uppercase mb-1.5">รายการหลักอื่น ๆ</p>
        <div className="divide-y divide-line/60 mb-3">
          {otherMainServices.map((s) => (
            <EditableRow key={s.id} service={s} prefix="" onSaved={handleSaved} />
          ))}
        </div>

        <p className="text-[11px] font-bold text-gold uppercase mb-1.5">รายการเสริม</p>
        <div className="divide-y divide-line/60">
          {addonServices.map((s) => (
            <EditableRow key={s.id} service={s} prefix="+" onSaved={handleSaved} />
          ))}
        </div>

        <p className="text-xs text-ink-soft mt-4 leading-relaxed border-t border-line pt-3">
          🎁 โบนัสช่าง: เดือนไหนค่าคอมรวมถึง 8,000 บาท ร้านให้เพิ่มอีก 15% ของยอดเดือนนั้น<br />
          <span className="text-ink-faint">
            (ค่าคอมของแอดมิน เช่น แพ็คเกจ 3/5 ครั้ง และโบนัส 300 บาท/วัน เป็นของแอดมินเท่านั้น
            แอปนี้ทำเฉพาะฝั่งช่าง จึงไม่รวมอยู่ในนี้)
          </span>
        </p>
      </div>
    </div>
  );
}
