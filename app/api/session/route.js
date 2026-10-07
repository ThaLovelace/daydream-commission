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
  const { userId, pin } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'กรุณาเลือกช่าง' }, { status: 400 });
  }

  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN ต้องเป็นตัวเลข 4-6 หลัก' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 });
  }

  // Verify PIN
  if (user.pin !== pin) {
    return NextResponse.json({ error: 'PIN ไม่ถูกต้อง' }, { status: 401 });
  }

  setSessionCookie(userId);
  return NextResponse.json({ user });
}

async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}

module.exports = { GET, POST, DELETE };
