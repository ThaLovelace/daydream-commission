const { NextResponse } = require('next/server');
const { prisma } = require('../../../lib/prisma');

// ลำดับการแสดงผลของแต่ละหมวด: แพ็คหลัก 1-5 -> รายการหลักอื่นๆ -> รายการเสริม
const CATEGORY_ORDER = { main: 0, special: 1, addon: 2 };

async function GET() {
  const [branches, servicesRaw] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
    prisma.service.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);
  // เรียงตามหมวดก่อน (main -> special -> addon) แล้วค่อยเรียงตาม sortOrder ภายในหมวดเดียวกัน
  const services = [...servicesRaw].sort(
    (a, b) => (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)
  );
  return NextResponse.json({ branches, services });
}

module.exports = { GET };