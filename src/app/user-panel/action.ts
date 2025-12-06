'use server'

import { createSesstion, lookSesstion } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { redirect } from "next/navigation";

export async function sentForm(formData: FormData, isAccepted: boolean) {
  const trimmedFullName = formData.get('fullName');
  const trimmedCompanyName = formData.get('companyName');
  const trimmedContact = formData.get('contact');
  const selectedCategories = formData.get('selectedCategories');
  const selectedLanguage = formData.get('selectedLanguage');
  
  
  try {
    const docRef = await addDoc(collection(db, 'userPanelSubmissions'), {
      fullName: trimmedFullName,
      companyName: trimmedCompanyName,
      contact: trimmedContact,
      categories: [selectedCategories],
      language: selectedLanguage,
      pdpaAccepted: isAccepted,
      createdAt: serverTimestamp(),
    })

  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    redirect('/usermatching')
  }
}
