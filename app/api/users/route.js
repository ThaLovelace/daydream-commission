const { NextResponse } = require('next/server');
const { prisma } = require('../../../lib/prisma');

async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ users });
}

async function POST(req) {
  const { name, pin } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'กรุณาใส่ชื่อ' }, { status: 400 });
  }

  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN ต้องเป็นตัวเลข 4-6 หลัก' }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      role: 'technician',
      pin,
    },
  });

  return NextResponse.json({ user });
}

module.exports = { GET, POST };
