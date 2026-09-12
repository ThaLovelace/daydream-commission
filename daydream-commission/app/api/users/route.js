const { NextResponse } = require('next/server');
const { prisma } = require('../../../lib/prisma');

async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ users });
}

async function POST(req) {
  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'กรุณาใส่ชื่อ' }, { status: 400 });
  }
  const user = await prisma.user.create({ data: { name: name.trim(), role: 'technician' } });
  return NextResponse.json({ user });
}

module.exports = { GET, POST };
