'use server'
import { cookies } from 'next/headers'

export async function createSesstion(id: string) {
  const cookieStore = await cookies();

  // อ่าน cookie ที่มีอยู่แล้ว
  const existingCookie = cookieStore.get('visiterId');

  // อายุ cookie = 1 วัน (มิลลิวินาที)
  const oneDay = 4 * 24 * 60 * 60 * 1000;

  // เช็กว่ามี cookie อยู่แล้วหรือไม่
  if (existingCookie?.value) {
    const { value } = existingCookie;

    try {
      // แปลงค่า cookie ที่เก็บไว้ (id + expireTime)
      const parsed = JSON.parse(value);
      const expireTime = parsed.expire;

      // ถ้ายังไม่หมดอายุ → return ว่ามี cookie แล้ว
      if (Date.now() < expireTime) {
        return "/usermatching";
      }
    } catch (err) {
      // ถ้า parse error ให้ทำเหมือนไม่มี cookie
    }
  }

  // ถ้าไม่มี cookie หรือหมดอายุแล้ว → สร้างใหม่
  const expireTimestamp = Date.now() + oneDay;

  cookieStore.set(
    'visiterId',
    JSON.stringify({
      id,
      expire: expireTimestamp,
    }),
    {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      // expires ใช้ Date
      expires: new Date(expireTimestamp),
    }
  );

  return id;
}


export async function lookSesstion(){
  const cookieStore = await cookies();
  const cookie = cookieStore.get('visiterId')
  return cookie?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('visiterId');
}

// export async function lookUidSesstion(){
//   const cookie = localStorage.getItem('userId')
//   return cookie;
// }