'use server'

import { createSesstion, lookSesstion } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function sentForm(formData: FormData, isAccepted: boolean) {
  const trimmedFullName = formData.get('fullName');
  const trimmedCompanyName = formData.get('companyName');
  const trimmedContact = formData.get('contact');
  const selectedCategories = formData.get('selectedCategories');
  const selectedLanguage = formData.get('selectedLanguage');
  const selectedPosition = formData.get('position');
  let isSuccess = false;
  try {
    const docRef = await addDoc(collection(db, 'userPanelSubmissions'), {
      fullName: trimmedFullName,
      companyName: trimmedCompanyName,
      contact: trimmedContact,
      categories: [selectedCategories],
      language: selectedLanguage,
      position: selectedPosition,
      pdpaAccepted: isAccepted,
      createdAt: serverTimestamp(),
    })
    if (docRef.id) {
      console.log("บันทึกเสร็จเเล้ว ID:", docRef.id);
      await createSesstion(docRef.id);
    }
    isSuccess = true;
    return true;
  } catch (error) {
    console.error('Error submitting form:', error);
  }
}
