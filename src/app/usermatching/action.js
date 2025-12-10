'use server'

import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { lookSesstion } from '@/lib/auth';


export async function loadProblemTag() {
  try {
    const tagsSnapshot = await getDocs(collection(db, 'problemTags'));
    const tagMap = new Map();
    tagsSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const name = data?.name?.trim();
      if (!name) return;
      const color = (data?.color || '#e5e7eb').trim();
      const key = name.toLowerCase();
      if (!tagMap.has(key)) {
        tagMap.set(key, { name, color });
      }
    });
     return Array.from(tagMap.values());
  } catch (error) {
    console.error('Error loading exhibitors:', error);
    return error;
  }
};


export async function queryMatching() {
  try {
    const visitorId = await lookSesstion();
    if (!visitorId) {
      console.error('Visitor ID is missing, skipping Firebase fetch.'); return; // ออกจากฟังก์ชันไปเลย ไม่ต้องไปต่อ
    }
    const visitorDocRef = doc(db, 'userPanelSubmissions', visitorId);
    const visitorSnap = await getDoc(visitorDocRef);
    let visitorInterests = [];

    if (visitorSnap.exists()) {
      const data = visitorSnap.data();
      visitorInterests = data.categories || [];
    }
    const exhibitorsRef = collection(db, 'exhibitors');
    const q = query(exhibitorsRef, where('categories', 'array-contains-any', visitorInterests));
    const querySnapshot = await getDocs(q);

    const exhibitorsData = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Only include exhibitors that have been saved (have companyName and isComplete flag)
      if (data.isComplete && data.companyName && data.categories && data.categories.length > 0) {
        exhibitorsData.push({
          id: doc.id,
          ...data,
        });
      }
    });
    return exhibitorsData;
  } catch (error) {
    console.error('Error loading exhibitors:', error);
    return error;
  }
};
