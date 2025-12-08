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