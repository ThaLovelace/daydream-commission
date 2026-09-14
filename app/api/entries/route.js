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
    // เรียงตาม sortOrder ที่ผู้ใช้จัดเอง (ลากสลับได้จากหน้าบันทึก) ใช้ createdAt เป็นตัวรองกันลำดับซ้ำ
    orderBy: [{ entryDate: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
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

  // รายการใหม่ต่อท้ายลิสของวันนั้นเสมอ (ลากสลับทีหลังได้)
  const last = await prisma.entry.aggregate({
    where: { userId, entryDate },
    _max: { sortOrder: true },
  });
  const sortOrder = (last._max.sortOrder ?? -1) + 1;

  const entry = await prisma.entry.create({
    data: {
      userId, branchId, serviceId, entryDate,
      sortOrder,
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