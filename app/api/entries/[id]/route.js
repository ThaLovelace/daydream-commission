const { NextResponse } = require('next/server');
const { prisma } = require('../../../../lib/prisma');

const includeRelations = {
  branch: true,
  service: true,
  addons: { include: { service: true } },
};

async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { branchId, serviceId, addonIds = [], customAmount = 0, customLabel, startTime } = body;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: 'ไม่พบรายการบริการ' }, { status: 404 });

  const addonServices = addonIds.length
    ? await prisma.service.findMany({ where: { id: { in: addonIds } } })
    : [];
  const addonSum = addonServices.reduce((s, a) => s + a.price, 0);
  const commission = service.price + addonSum + (Number(customAmount) || 0);

  await prisma.entryAddon.deleteMany({ where: { entryId: id } });
  const entry = await prisma.entry.update({
    where: { id },
    data: {
      branchId, serviceId,
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

async function DELETE(req, { params }) {
  const { id } = params;
  await prisma.entry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PUT, DELETE };