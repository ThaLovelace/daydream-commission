'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, BarChart3, Settings } from 'lucide-react';

const TABS = [
  { href: '/day', label: 'บันทึกวันนี้', Icon: CalendarDays },
  { href: '/month', label: 'รายงานเดือน', Icon: BarChart3 },
  { href: '/settings', label: 'ตั้งค่า', Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-white border-t border-line flex">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 tap-target ${
              active ? 'text-primary' : 'text-ink-faint'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
