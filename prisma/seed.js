const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRANCHES = ['Suriwong', 'The Kannas'];

const MAIN_SERVICES = [
  { name: '1-Take a nap', price: 45 },
  { name: '2-Better sleep', price: 70 },
  { name: '3-Head to toe', price: 70 },
  { name: '4-Day dreamer', price: 85 },
  { name: 'Hair wash, blow dry, set', price: 25 },
  { name: 'Mini better sleep', price: 50 },
  { name: 'Body relax', price: 50 },
  { name: 'Indian head massage', price: 40 },
  { name: 'Foot Reflexology massage', price: 40 },
  { name: 'ต่อผม', price: 25 },
  { name: 'ผมยาวเลยสะดือ', price: 25 },
];

const ADDON_SERVICES = [
  { name: 'Scalp scrub', price: 20 },
  { name: 'Keratin Coating', price: 20 },
  { name: 'Hot Stone Foot Reflexology', price: 20 },
];

async function main() {
  for (const name of BRANCHES) {
    await prisma.branch.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const s of MAIN_SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: s.name, category: 'main' } });
    if (!existing) await prisma.service.create({ data: { ...s, category: 'main' } });
  }
  for (const s of ADDON_SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: s.name, category: 'addon' } });
    if (!existing) await prisma.service.create({ data: { ...s, category: 'addon' } });
  }
  const existingUser = await prisma.user.findFirst({ where: { name: 'อ้อ' } });
  if (!existingUser) {
    await prisma.user.create({ data: { name: 'อ้อ', role: 'technician' } });
  }
  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
