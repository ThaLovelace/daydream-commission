'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [picked, setPicked] = useState(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  async function addUser() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.user) {
      setUsers((u) => [...u, data.user]);
      setNewName('');
    }
  }

  async function login() {
    if (!picked) return;
    setBusy(true);
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: picked }),
    });
    router.push('/day');
  }

  return (
    <div className="min-h-screen mx-auto max-w-md flex flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 pt-12 pb-9 rounded-b-[28px]">
        <p className="text-[11px] tracking-wider uppercase opacity-70">daydream massage &amp; spa</p>
        <h1 className="text-lg font-semibold mt-2">เข้าสู่ระบบครั้งแรก</h1>
      </div>
      <div className="px-6 py-6 flex-1">
        <p className="text-sm text-ink-soft mb-4">
          เลือกชื่อของคุณ — ครั้งต่อไปเปิดแอปจะเข้าหน้าบันทึกทันที ไม่ต้องเลือกซ้ำ
        </p>

        {loading ? (
          <p className="text-sm text-ink-faint">กำลังโหลด...</p>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setPicked(u.id)}
                className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition tap-target ${
                  picked === u.id ? 'border-primary bg-primary-soft' : 'border-line bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center text-sm font-bold flex-none">
                  {u.name.slice(0, 2)}
                </div>
                <div>
                  <p className="text-[15px] font-semibold">{u.name}</p>
                  <p className="text-xs text-ink-soft">ช่าง</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="เพิ่มชื่อช่างใหม่"
            className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm tap-target"
          />
          <button
            onClick={addUser}
            disabled={busy}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold bg-white tap-target"
          >
            เพิ่ม
          </button>
        </div>

        <button
          onClick={login}
          disabled={!picked || busy}
          className="w-full mt-8 rounded-2xl bg-primary text-white font-bold py-3.5 tap-target disabled:opacity-40"
        >
          เข้าใช้งาน
        </button>
      </div>
    </div>
  );
}
