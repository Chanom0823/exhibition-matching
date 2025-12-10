// app/api/matching/route.js

import { NextResponse } from 'next/server';

export async function GET() {
  // สมมติว่านี่คือข้อมูลที่จะส่งกลับ
  const data = { message: 'User matching data' };

  return NextResponse.json(data, {
    // 🔥 ใส่ Cache-Control Header ตรงนี้
    headers: {
      'Cache-Control': 'max-age=0, must-revalidate', // สั่งให้ Browser เช็คใหม่ทุกครั้ง
    },
  });
}