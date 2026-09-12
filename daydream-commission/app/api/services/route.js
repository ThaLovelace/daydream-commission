const { NextResponse } = require('next/server');
const { prisma } = require('../../../lib/prisma');

async function GET() {
  const [branches, services] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
    prisma.service.findMany({ orderBy: [{ category: 'desc' }, { sortOrder: 'asc' }] }),
  ]);
  return NextResponse.json({ branches, services });
}

module.exports = { GET };
