const { NextResponse } = require('next/server');
const { prisma } = require('../../../lib/prisma');

const includeRelations = {
  branch: true,
  service: true,
  addons: { include: { service: true } },
};

async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date');
  const month = searchParams.get('month');
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 });

  const where = { userId };
  if (date) where.entryDate = date;
  else if (month) where.entryDate = { startsWith: month };

  const entries = await prisma.entry.findMany({
    where,
    include: includeRelations,
    // เรียงตามลำดับที่กรอกจริง (createdAt) แทนเวลาที่พิมพ์เอง — กันปัญหาลำดับสลับตอนกรอกย้อนหลัง
    orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json({ entries });
}

async function POST(req) {
  const body = await req.json();
  const { userId, branchId, serviceId, addonIds = [], entryDate, customAmount = 0, customLabel, startTime } = body;
  if (!userId || !branchId || !serviceId || !entryDate) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: 'ไม่พบรายการบริการ' }, { status: 404 });

  const addonServices = addonIds.length
    ? await prisma.service.findMany({ where: { id: { in: addonIds } } })
    : [];
  const addonSum = addonServices.reduce((s, a) => s + a.price, 0);
  const commission = service.price + addonSum + (Number(customAmount) || 0);

  const entry = await prisma.entry.create({
    data: {
      userId, branchId, serviceId, entryDate,
      customAmount: Number(customAmount) || 0,
      customLabel: customLabel || null,
      startTime: startTime || null,
      commission,
      addons: { create: addonServices.map((a) => ({ serviceId: a.id })) },
    },
    include: includeRelations,
  });
  return NextResponse.json({ entry });
}

module.exports = { GET, POST };