const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRANCHES = ['Suriwong', 'The Kannas'];

// ราคาตรงตาม "ตารางค่าคอมช่างและแอดมิน" คอลัมน์ค่าคอมใหม่ (เฉพาะหมวดของช่าง)
// oldNames = ชื่อเดิม (ภาษาอังกฤษ) เผื่อฐานข้อมูลเก่ามีอยู่แล้ว จะได้อัปเดตชื่อ/ราคาแทนที่จะสร้างซ้ำ
// sortOrder ใช้จัดลำดับการแสดงผล: แพ็คหลัก 1-4 มาก่อน แล้วตามด้วยรายการอื่น ๆ
const MAIN_SERVICES = [
  { name: 'แพ็ค 1 งีบหลับสบาย (Take a nap)', price: 45, sortOrder: 0, oldNames: ['1-Take a nap'] },
  { name: 'แพ็ค 2 หลับสนิทขึ้น (Better sleep)', price: 70, sortOrder: 1, oldNames: ['2-Better sleep'] },
  { name: 'แพ็ค 3 นวดทั้งตัว (Head to toe)', price: 70, sortOrder: 2, oldNames: ['3-Head to toe'] },
  { name: 'แพ็ค 4 เพลินทั้งวัน (Day dreamer)', price: 85, sortOrder: 3, oldNames: ['4-Day dreamer'] },
  { name: 'สระ เป่า เซ็ตผม', price: 25, sortOrder: 4, oldNames: ['Hair wash, blow dry, set'] },
  { name: 'หลับสนิทขึ้น มินิ (Mini better sleep)', price: 50, sortOrder: 5, oldNames: ['Mini better sleep'] },
  { name: 'นวดผ่อนคลายตัว (Body relax)', price: 50, sortOrder: 6, oldNames: ['Body relax'] },
  { name: 'นวดศีรษะอินเดีย (Indian head)', price: 40, sortOrder: 7, oldNames: ['Indian head massage'] },
  { name: 'นวดฝ่าเท้า รีเฟล็กซ์ (Foot Reflexology)', price: 40, sortOrder: 8, oldNames: ['Foot Reflexology massage'] },
  { name: 'ต่อผม', price: 25, sortOrder: 9, oldNames: ['ต่อผม'] },
  { name: 'ผมยาวเลยสะดือ', price: 25, sortOrder: 10, oldNames: ['ผมยาวเลยสะดือ'] },
];

const ADDON_SERVICES = [
  { name: 'ขัดหนังศีรษะ (สครับ)', price: 20, sortOrder: 0, oldNames: ['Scalp scrub'] },
  { name: 'เคลือบเคราติน (Keratin)', price: 20, sortOrder: 1, oldNames: ['Keratin Coating'] },
  { name: 'นวดเท้าหินร้อน (Hot Stone)', price: 20, sortOrder: 2, oldNames: ['Hot Stone Foot Reflexology'] },
];

async function upsertService(s, category) {
  const existing = await prisma.service.findFirst({
    where: {
      category,
      OR: [{ name: s.name }, ...(s.oldNames || []).map((n) => ({ name: n }))],
    },
  });
  const data = { name: s.name, price: s.price, sortOrder: s.sortOrder, category };
  if (existing) {
    await prisma.service.update({ where: { id: existing.id }, data });
  } else {
    await prisma.service.create({ data });
  }
}

async function main() {
  for (const name of BRANCHES) {
    await prisma.branch.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const s of MAIN_SERVICES) {
    await upsertService(s, 'main');
  }
  for (const s of ADDON_SERVICES) {
    await upsertService(s, 'addon');
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
