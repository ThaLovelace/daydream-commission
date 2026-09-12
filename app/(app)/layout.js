import { redirect } from 'next/navigation';
import { getSessionUserId } from '../../lib/session';
import { prisma } from '../../lib/prisma';
import TopHeader from '../../components/TopHeader';
import BottomNav from '../../components/BottomNav';

export default async function AppLayout({ children }) {
  const userId = getSessionUserId();
  if (!userId) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect('/login');

  return (
    <div className="pb-20 print:pb-0">
      <div className="no-print">
        <TopHeader userName={user.name} />
      </div>
      <main className="px-4 pt-4 print:p-0">{children}</main>
      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  );
}