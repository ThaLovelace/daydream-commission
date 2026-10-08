'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [pickedUserId, setPickedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  function handlePick(user) {
    setPickedUserId(user.id);
    setSelectedUser(user);
    setPin('');
    setError('');
  }

  function addDigit(value) {
    if (pin.length >= 4 || busy) return; // Only allow 4 digits
    setPin((prev) => prev + value);
    setError('');
  }

  function removeDigit() {
    if (busy) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }

  async function addUser() {
    const name = newName.trim();
    const safePin = newPin.trim();

    if (!name) {
      setError('กรุณาใส่ชื่อช่าง');
      return;
    }

    if (!/^\d{4}$/.test(safePin)) {
      setError('PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น');
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
      setUsers((current) => [...current, data.user]);
      setNewName('');
      setNewPin('');
      setPickedUserId(data.user.id);
      setSelectedUser(data.user);
      setPin('');
    }
  }

  async function login() {
    if (!pickedUserId) {
      setError('กรุณาเลือกชื่อช่างก่อน');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN ต้องมี 4 หลัก');
      return;
    }

    setBusy(true);
    setError('');

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pickedUserId, pin }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error || 'PIN ไม่ถูกต้อง');
      setPin('');
      return;
    }

    router.push('/day');
  }

  function goBackToUserList() {
    setPickedUserId(null);
    setSelectedUser(null);
    setPin('');
    setError('');
  }

  if (!pickedUserId || !selectedUser) {
    return (
      <div className="min-h-screen mx-auto max-w-md flex flex-col bg-[#f8f4ef]">
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 pt-12 pb-9 rounded-b-[28px] shadow-lg shadow-primary/20">
          <p className="text-[11px] tracking-wider uppercase opacity-75">daydream massage &amp; spa</p>
          <h1 className="text-lg font-semibold mt-2">เลือกช่างของคุณ</h1>
        </div>

        <div className="px-6 py-6 flex-1">
          <p className="text-sm text-ink-soft mb-5">กดเลือกชื่อช่าง แล้วกรอก PIN 4 หลัก เพื่อเข้าสู่ระบบ</p>

          {loading ? (
            <p className="text-sm text-ink-faint">กำลังโหลด...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handlePick(user)}
                  className="rounded-2xl border-2 border-line bg-white p-4 text-center transition hover:border-primary hover:bg-primary-soft tap-target"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {user.name.slice(0, 2)}
                  </div>
                  <p className="text-[15px] font-semibold">{user.name}</p>
                  <p className="text-xs text-ink-soft">ช่าง</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-line bg-white p-3">
            <p className="mb-2 text-sm font-semibold text-ink-soft">เพิ่มช่างใหม่</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ชื่อช่าง"
                className="flex-1 rounded-xl border border-line px-3 py-2.5 text-sm tap-target"
              />
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                placeholder="PIN"
                type="password"
                className="w-20 rounded-xl border border-line px-3 py-2.5 text-sm tap-target"
              />
            </div>
            <button
              onClick={addUser}
              disabled={busy}
              className="mt-3 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-semibold bg-white tap-target disabled:opacity-50"
            >
              เพิ่มช่าง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto max-w-md flex flex-col bg-[#f8f4ef]">
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 pt-12 pb-9 rounded-b-[28px] shadow-lg shadow-primary/20">
        <button onClick={goBackToUserList} className="text-sm opacity-80 mb-2">
          ← เปลี่ยนช่าง
        </button>
        <h1 className="text-lg font-semibold">กรอก PIN</h1>
      </div>

      <div className="px-6 py-6 flex-1 flex flex-col">
        <p className="text-sm text-ink-soft mb-5">
          ช่าง: <span className="font-bold text-primary-dark">{selectedUser.name}</span>
        </p>

        <div className="mb-8 flex justify-center">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition ${
                  index < pin.length ? 'bg-primary text-white' : 'bg-line text-ink-faint'
                }`}
              >
                {index < pin.length ? '●' : '○'}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => addDigit(String(digit))}
              disabled={pin.length >= 4 || busy}
              className="rounded-2xl border-2 border-line bg-white py-5 text-2xl font-bold tap-target hover:border-primary hover:bg-primary-soft disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => addDigit('0')}
            disabled={pin.length >= 4 || busy}
            className="rounded-2xl border-2 border-line bg-white py-5 text-2xl font-bold tap-target hover:border-primary hover:bg-primary-soft disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={removeDigit}
            disabled={!pin || busy}
            className="rounded-2xl border-2 border-red-200 bg-red-50 py-5 text-lg font-bold text-red-600 tap-target hover:bg-red-100 disabled:opacity-50"
          >
            ลบ
          </button>
        </div>

        <button
          onClick={login}
          disabled={pin.length !== 4 || busy}
          className="mt-auto w-full rounded-2xl bg-primary text-white font-bold py-4 tap-target disabled:opacity-40 text-lg"
        >
          {busy ? 'กำลังตรวจสอบ...' : 'เข้าใช้งาน'}
        </button>
      </div>
    </div>
  );
}
