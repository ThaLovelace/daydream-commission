const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRANCHES = ['Suriwong', 'The Kannas'];

// 5 แพ็กเกจหลัก (ลูกค้าต้องเลือก 1 ใน 5 นี้ก่อนเสมอ) — ไม่แปลชื่อแพ็คเป็นไทย เก็บชื่อเดิมไว้ในวงเล็บ
// ตัดคำแปลไทยที่ใส่ไว้ก่อนหน้าออก เพราะฟังดูแปลก ใช้แค่ "แพ็ค N (ชื่อเดิม)" พอ
const MAIN_SERVICES = [
  { name: 'แพ็ค 1 (Take a nap)', price: 45, sortOrder: 0, oldNames: ['1-Take a nap', 'แพ็ค 1 งีบหลับสบาย (Take a nap)'] },
  { name: 'แพ็ค 2 (Better sleep)', price: 70, sortOrder: 1, oldNames: ['2-Better sleep', 'แพ็ค 2 หลับสนิทขึ้น (Better sleep)'] },
  { name: 'แพ็ค 3 (Head to toe)', price: 70, sortOrder: 2, oldNames: ['3-Head to toe', 'แพ็ค 3 นวดทั้งตัว (Head to toe)'] },
  { name: 'แพ็ค 4 (Day dreamer)', price: 85, sortOrder: 3, oldNames: ['4-Day dreamer', 'แพ็ค 4 เพลินทั้งวัน (Day dreamer)'] },
  { name: 'แพ็ค 5 มินิ (Mini better sleep)', price: 50, sortOrder: 4, oldNames: ['Mini better sleep', 'หลับสนิทขึ้น มินิ (Mini better sleep)'] },
];

// บริการหลักแบบเดี่ยว ๆ ที่ไม่ใช่แพ็ค 1-5 แต่ลูกค้าก็เลือกเป็นบริการหลักได้เหมือนกัน (หมวดของช่าง)
const SPECIAL_SERVICES = [
  { name: 'สระ เป่า เซ็ตผม', price: 25, sortOrder: 5, oldNames: ['Hair wash, blow dry, set'] },
  { name: 'นวดผ่อนคลายตัว (Body relax)', price: 50, sortOrder: 6, oldNames: ['Body relax'] },
  { name: 'นวดศีรษะอินเดีย (Indian head)', price: 40, sortOrder: 7, oldNames: ['Indian head massage'] },
  { name: 'นวดฝ่าเท้า รีเฟล็กซ์ (Foot Reflexology)', price: 40, sortOrder: 8, oldNames: ['Foot Reflexology massage'] },
];

// บริการเสริม (Add-on) — บวกเพิ่มจากบริการหลักได้หลายรายการต่อ 1 ลูกค้า
const ADDON_SERVICES = [
  { name: 'ขัดหนังศีรษะ (สครับ)', price: 20, sortOrder: 0, oldNames: ['Scalp scrub', '** Add scalp scrub'] },
  { name: 'เคลือบเคราติน (Keratin)', price: 20, sortOrder: 1, oldNames: ['Keratin Coating', '** Add Keratin Coating'] },
  { name: 'นวดเท้าหินร้อน (Hot Stone)', price: 20, sortOrder: 2, oldNames: ['Hot Stone Foot Reflexology', '** Add Hot Stone Foot Reflexology'] },
  { name: 'ต่อผม', price: 25, sortOrder: 3, oldNames: ['ต่อผม'] },
  { name: 'ผมยาวเลยสะดือ', price: 25, sortOrder: 4, oldNames: ['ผมยาวเลยสะดือ'] },
];

// ค้นหาแบบไม่ล็อกหมวดเดิม เผื่อรายการนี้เคยอยู่คนละหมวดมาก่อน (เช่นมินิเคยเป็น special ตอนนี้ย้ายมาเป็น main)
// จะได้ "ย้ายหมวด" ให้รายการเดิม แทนที่จะสร้างรายการซ้ำ
async function upsertService(s, category) {
  const existing = await prisma.service.findFirst({
    where: { OR: [{ name: s.name }, ...(s.oldNames || []).map((n) => ({ name: n }))] },
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

  // บันทึก 5 แพ็กเกจหลัก (category: 'main')
  for (const s of MAIN_SERVICES) {
    await upsertService(s, 'main');
  }

  // บันทึกบริการหลักแบบเดี่ยวอื่น ๆ (category: 'special')
  for (const s of SPECIAL_SERVICES) {
    await upsertService(s, 'special');
  }

  // บันทึกบริการเสริม (category: 'addon')
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });