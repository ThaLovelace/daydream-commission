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
  const [newPin, setNewPin] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [pinDraft, setPinDraft] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  useEffect(() => {
    fetch('/api/session')
      .then((r) => r.json())
      .then((d) => setUserId(d.user?.id || null));

    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));

    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => setServices(d.services || []));
  }, []);

  async function addUser() {
    const name = newName.trim();
    const pin = newPin.trim();

    if (!name) {
      setPinError('กรุณาใส่ชื่อช่าง');
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setPinError('PIN ต้องเป็นตัวเลข 4-6 หลัก');
      return;
    }

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin }),
    });

    const data = await res.json();
    if (data.user) {
      setUsers((u) => [...u, data.user]);
      setNewName('');
      setNewPin('');
      setPinError('');
      setPinSuccess('เพิ่มช่างสำเร็จ');
      setTimeout(() => setPinSuccess(''), 3000);
    } else {
      setPinError(data.error || 'เพิ่มช่างไม่สำเร็จ');
    }
  }

  async function saveUserPin(userIdToUpdate) {
    const trimmed = pinDraft.trim();
    if (!/^\d{4,6}$/.test(trimmed)) {
      setPinError('PIN ต้องเป็นตัวเลข 4-6 หลัก');
      return;
    }

    setSavingPin(true);
    setPinError('');
    setPinSuccess('');

    const res = await fetch(`/api/users/${userIdToUpdate}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: trimmed }),
    });

    const data = await res.json();
    setSavingPin(false);

    if (!res.ok) {
      setPinError(data.error || 'อัปเดต PIN ไม่สำเร็จ');
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === userIdToUpdate ? data.user : u)));
    setEditingUserId(null);
    setPinDraft('');
    setPinSuccess('อัปเดต PIN สำเร็จ');
    setTimeout(() => setPinSuccess(''), 3000);
  }

  function handleSaved(updated) {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  const packServices = services.filter((s) => s.category === 'main');
  const otherMainServices = services.filter((s) => s.category === 'special');
  const addonServices = services.filter((s) => s.category === 'addon');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-line p-4 shadow-card">
        <h2 className="font-bold text-primary-dark text-[15px] mb-3">จัดการช่าง / PIN</h2>
        <div className="space-y-3 mb-4">
          {users.map((u) => (
            <div key={u.id} className="border border-line rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 text-sm mb-2">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-ink-soft">PIN: {u.pin ? '••••' : 'ยังไม่มี PIN'}</p>
                </div>
                {u.id === userId && (
                  <span className="text-[10.5px] bg-primary-soft text-primary-dark font-bold px-2 py-0.5 rounded-full">คุณ</span>
                )}
              </div>

              {editingUserId === u.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="password"
                    value={pinDraft}
                    onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN 4-6 หลัก"
                    autoFocus
                    className="flex-1 rounded-lg border border-line px-3 py-2 text-sm tap-target"
                  />
                  <button
                    onClick={() => saveUserPin(u.id)}
                    disabled={savingPin}
                    className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {savingPin ? '...' : 'บันทึก'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingUserId(null);
                      setPinDraft('');
                      setPinError('');
                    }}
                    className="rounded-lg border border-line px-3 py-2 text-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingUserId(u.id);
                    setPinDraft(u.pin || '');
                    setPinError('');
                    setPinSuccess('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium"
                >
                  <Pencil size={12} /> เปลี่ยน PIN
                </button>
              )}
            </div>
          ))}
        </div>

        {pinError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pinError}
          </div>
        )}

        {pinSuccess && (
          <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {pinSuccess}
          </div>
        )}

        <div className="border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink-soft mb-2">เพิ่มช่างใหม่</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อช่าง"
              className="flex-1 rounded-lg border border-line px-3 py-2.5 text-sm tap-target"
            />
            <input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN"
              type="password"
              className="w-24 rounded-lg border border-line px-3 py-2.5 text-sm tap-target"
            />
            <button
              onClick={addUser}
              className="rounded-lg bg-primary text-white px-4 py-2.5 text-sm font-semibold tap-target"
            >
              เพิ่ม
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-line p-4 shadow-card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-primary-dark text-[15px]">อัตราค่าคอม (ของช่าง)</h2>
        </div>
        <p className="text-[11px] text-ink-faint mb-3">
          แตะที่ตัวเลขเพื่อแก้ไขราคาได้เลย — รายการที่บันทึกไปแล้วในอดีตจะไม่เปลี่ยนค่าเดิม
        </p>

        <p className="text-[11px] font-bold text-primary uppercase mb-1.5">แพ็คหลัก 1-5</p>
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
      </div>
    </div>
  );
}
