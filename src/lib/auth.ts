'use server'
import { cookies } from 'next/headers'
export async function createSesstion(id:string){
  const cookieStore = await cookies();
  cookieStore.set('visiterId', id, {
    httpOnly:true,
    path:'/',
    sameSite:'lax',
  })
  return id;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('visiterId');
}