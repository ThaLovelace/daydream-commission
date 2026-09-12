import { redirect } from 'next/navigation';
import { getSessionUserId } from '../lib/session';
import { prisma } from '../lib/prisma';

export default async function Home() {
  const userId = getSessionUserId();
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) redirect('/day');
  }
  redirect('/login');
}
