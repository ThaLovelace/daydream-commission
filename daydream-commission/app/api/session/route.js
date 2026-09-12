const { NextResponse } = require('next/server');
const { prisma } = require('../../../lib/prisma');
const { getSessionUserId, setSessionCookie, clearSessionCookie } = require('../../../lib/session');

async function GET() {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json({ user: user || null });
}

async function POST(req) {
  const { userId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
  setSessionCookie(userId);
  return NextResponse.json({ user });
}

async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}

module.exports = { GET, POST, DELETE };
