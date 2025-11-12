import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    async function testFirebase() {
      const querySnapshot = await getDocs(collection(db, "test"));
      console.log("Connected to Firebase!", querySnapshot.size);
      console.log('Firebase API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    }
    testFirebase();
  }, []);

  return (
    <main className="flex items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-blue-600">
        Exhibition Matching System 
      </h1>
    </main>
  );
}
