'use client';
import { useRouter } from 'next/navigation';

export default function TopHeader({ userName }) {
  const router = useRouter();

  async function switchUser() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <header className="no-print bg-gradient-to-br from-primary to-primary-dark text-white px-5 pt-6 pb-5 rounded-b-3xl shadow-lg shadow-primary/20">
      <p className="text-[11px] tracking-wider uppercase opacity-75">Daydream Massage &amp; Spa</p>
      <h1 className="text-xl font-bold mt-1.5">สมุดค่าคอมส่วนตัว</h1>
      <p className="text-sm opacity-90 mt-1">
        ช่าง: {userName}
        <button onClick={switchUser} className="ml-2 underline text-xs opacity-80">
          สลับผู้ใช้
        </button>
      </p>
    </header>
  );
}
