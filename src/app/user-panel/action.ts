'use server'

import { createSesstion, lookSesstion } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function sentForm(formData: FormData) {
  const trimmedFullName = formData.get('fullName');
  const trimmedCompanyName = formData.get('companyName');
  const trimmedContact = formData.get('contact');
  const selectedCategories = formData.get('selectedCategories');
  const selectedLanguage = formData.get('selectedLanguage');

  try {
    console.log('trimmedFullName ' + trimmedFullName);
    console.log('trimmedCompanyName ' + trimmedCompanyName);
    console.log('trimmedContact ' + trimmedContact);
    console.log('selectedCategories ' + selectedCategories);
    console.log('selectedLanguage ' + selectedLanguage);
    // const docRef = await addDoc(collection(db, 'userPanelSubmissions'), {
    //   fullName: trimmedFullName,
    //   companyName: trimmedCompanyName,
    //   contact: trimmedContact,
    //   categories: selectedCategories,
    //   language: selectedLanguage,
    //   pdpaAccepted: true,
    //   createdAt: serverTimestamp(),
    // })

    // if (docRef.id) {
    //   console.log("บันทึกเสร็จเเล้ว ID", docRef.id)
    //   const result = await createSesstion(docRef.id)
    //   alert('Visiter ID ของคุณ คือ ' + result)
    // }
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem('userInterests', JSON.stringify(selectedCategories));
    // }

    // setSubmitMessage(t.submitSuccess);
    // setFormData({
    //   fullName: '',
    //   companyName: '',
    //   contact: '',
    //   categories: ['', ''],
    // });
    // setPdpaAgreed(true);
    // router.push('/usermatching');
  } catch (error) {
    console.error('Error submitting form:', error);
    // setSubmitMessage(t.submitError);
  } finally {
    // setIsSubmitting(false);
  }

}
