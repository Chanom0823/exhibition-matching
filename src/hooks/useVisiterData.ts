'use client';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

type VisiterData = {
  problemTags?: string;
  VisitcompanyName?: string;
  fullName?: string;
  language?:string;
  pdpaAcceptedtrue?: string;
  contact?: string;
}

const useVisiterData =(visiterId:string)=>{
  const [data, setData] = useState<VisiterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    if(!visiterId) return ;
    const fetchData = async ()=>{
      setLoading(true);
      try{
        const docRef = doc(db, "userPanelSubmissions", visiterId);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
          setData(docSnap.data());
        }else{
          setError("ไม่พบข้อมูลผู้เยี่ยมชมนี้");
        }
      }catch(err:any){
        console.error(err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [visiterId])
  return { data, loading, error };
}

export default useVisiterData