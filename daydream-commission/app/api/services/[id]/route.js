const { NextResponse } = require('next/server');
const { prisma } = require('../../../../lib/prisma');

async function PATCH(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { price, name } = body;

  const data = {};
  if (price !== undefined) {
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' }, { status: 400 });
    }
    data.price = Math.round(n);
  }
  if (name !== undefined) {
    if (!name.trim()) {
      return NextResponse.json({ error: 'กรุณาใส่ชื่อรายการ' }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'ไม่มีข้อมูลให้แก้ไข' }, { status: 400 });
  }

  const service = await prisma.service.update({ where: { id }, data });
  // หมายเหตุ: รายการที่บันทึกไปแล้วในอดีตจะไม่เปลี่ยนค่าคอมย้อนหลัง
  // เพราะค่าคอมถูกคำนวณและเก็บไว้ตายตัวตอนบันทึกรายการนั้น ๆ แล้ว
  return NextResponse.json({ service });
}

module.exports = { PATCH };
