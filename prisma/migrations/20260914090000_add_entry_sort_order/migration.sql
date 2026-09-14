-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: ใช้ลำดับ createdAt เดิมเป็นค่าเริ่มต้น ต่อ userId + entryDate
-- (ลูกค้าที่กรอกไปแล้วจะยังเห็นลำดับเดิมทุกอย่าง ไม่มีอะไรสลับกันตอน migrate)
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId", "entryDate" ORDER BY "createdAt" ASC
  ) - 1 AS rn
  FROM "Entry"
)
UPDATE "Entry" SET "sortOrder" = ranked.rn
FROM ranked
WHERE "Entry"."id" = ranked."id";
