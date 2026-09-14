const { NextResponse } = require('next/server');
const { prisma } = require('../../../../lib/prisma');

// ใช้ตอนผู้ใช้ลากสลับตำแหน่งรายการในลิสของวันนั้น ๆ
// รับลำดับ id ใหม่ทั้งชุดมาแล้วเซ็ต sortOrder = ตำแหน่งในอาเรย์ (ผูกกับ userId + entryDate กันแก้ข้ามวัน)
async function PATCH(req) {
  const body = await req.json();
  const { userId, entryDate, orderedIds } = body;
  if (!userId || !entryDate || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.entry.updateMany({
        where: { id, userId, entryDate },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

module.exports = { PATCH };
