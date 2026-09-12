'use client';
import { useEffect, useState } from 'react';

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

  const mainServices = services.filter((s) => s.category === 'main');
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
        <h2 className="font-bold text-primary-dark text-[15px] mb-3">อัตราค่าคอม (อ้างอิง)</h2>
        <p className="text-[11px] font-bold text-ink-soft uppercase mb-1.5">รายการหลัก</p>
        <div className="space-y-1.5 mb-3">
          {mainServices.map((s) => (
            <div key={s.id} className="flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="font-semibold tabular-nums">{s.price}฿</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] font-bold text-gold uppercase mb-1.5">รายการเสริม</p>
        <div className="space-y-1.5">
          {addonServices.map((s) => (
            <div key={s.id} className="flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="font-semibold tabular-nums">+{s.price}฿</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-soft mt-4 leading-relaxed">
          โบนัสช่าง: เดือนไหนค่าคอมรวมถึง 8,000 บาท ร้านให้เพิ่มอีก 15% ของยอดเดือนนั้น<br />
          (โบนัสวัน 300 บาทเป็นของแอดมินเท่านั้น ไม่เกี่ยวกับช่าง)
        </p>
      </div>
    </div>
  );
}
