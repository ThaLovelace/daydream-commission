'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [picked, setPicked] = useState(null);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  async function addUser() {
    const name = newName.trim();
    const safePin = newPin.trim();

    if (!name) {
      setError('กรุณาใส่ชื่อช่าง');
      return;
    }
    if (!/^\d{4,6}$/.test(safePin)) {
      setError('PIN ต้องเป็นตัวเลข 4-6 หลัก');
      return;
    }

    setBusy(true);
    setError('');

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin: safePin }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || 'เพิ่มช่างไม่สำเร็จ');
      return;
    }

    if (data.user) {
      setUsers((u) => [...u, data.user]);
      setNewName('');
      setNewPin('');
      setPicked(data.user.id);
      setPin('');
      setError('');
    }
  }

  async function login() {
    if (!picked) {
      setError('กรุณาเลือกชื่อช่างก่อน');
      return;
    }

    const safePin = pin.trim();
    if (!/^\d{4,6}$/.test(safePin)) {
      setError('กรุณากรอก PIN 4-6 หลัก');
      return;
    }

    setBusy(true);
    setError('');

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: picked, pin: safePin }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || 'PIN ไม่ถูกต้อง');
      return;
    }

    router.push('/day');
  }

  return (
    <div className="min-h-screen mx-auto max-w-md flex flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 pt-12 pb-9 rounded-b-[28px]">
        <p className="text-[11px] tracking-wider uppercase opacity-70">daydream massage &amp; spa</p>
        <h1 className="text-lg font-semibold mt-2">เข้าสู่ระบบด้วยชื่อและ PIN</h1>
      </div>
      <div className="px-6 py-6 flex-1">
        <p className="text-sm text-ink-soft mb-4">
          เลือกชื่อของคุณ แล้วใส่ PIN เพื่อเข้าระบบ
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-faint">กำลังโหลด...</p>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setPicked(u.id);
                  setPin('');
                  setError('');
                }}
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

        {picked && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-ink-soft">PIN ของช่างที่เลือก</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="กรอก PIN 4-6 หลัก"
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm tap-target"
              type="password"
            />
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-line bg-white p-3">
          <p className="mb-2 text-sm font-semibold text-ink-soft">เพิ่มช่างใหม่</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อช่าง"
              className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm tap-target"
            />
            <input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN"
              className="w-24 rounded-xl border border-line px-3 py-2.5 text-sm tap-target"
              type="password"
            />
          </div>
          <button
            onClick={addUser}
            disabled={busy}
            className="mt-3 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-semibold bg-white tap-target"
          >
            เพิ่มช่าง
          </button>
        </div>

        <button
          onClick={login}
          disabled={!picked || busy || !pin.trim()}
          className="w-full mt-8 rounded-2xl bg-primary text-white font-bold py-3.5 tap-target disabled:opacity-40"
        >
          เข้าใช้งาน
        </button>
      </div>
    </div>
  );
}
