'use client';

// PDPA Content Modal

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, addDoc, serverTimestamp, deleteDoc, doc, where, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {signOut } from 'firebase/auth';
import { lookSesstion } from '@/lib/auth';

const promptFont = localFont({
  src: [
    { path: '../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [{ path: '../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' }],
});

const translations = {
  TH: {
    dashboard: 'Dashboard',
    tabs: ['Dashboard', 'Profile'],
    searchPlaceholder: 'Search...',
    totalInterests: 'ผู้เข้าร่วมงานทั้งหมด',
    totalInterestsValue: '3,256',
    matched: 'ยอดสนใจ',
    matchedValue: '394',
    notMatched: 'ไม่ใช่ตัวเลือก',
    notMatchedValue: '2,536',
    contacts: 'การติดต่อ',
    contactsValue: '38',
    trendTitle: 'ปัญหาที่คนให้ความสนใจ',
    trendOutpatients: 'ยอดสนใจ',
    trendInpatients: 'ไม่ได้ติดต่อ',
    patientsByCategory: 'ผู้สนใจตามหมวดหมู่',
    timeAdmitted: 'ช่วงเวลาที่ติดต่อ',
    divisionLabel: 'หมวดหมู่',
    patientsLabel: 'จำนวน',
    logout: 'ออกจากระบบ',
    export: 'Export',
    tableNo: 'ลำดับ',
    tableName: 'รายชื่อที่สนใจ',
    tableContact: 'การติดต่อ',
    details: 'รายละเอียด',
    contact: 'ติดต่อ',
    contacted: 'ติดต่อแล้ว',
    notContacted: 'ยังไม่ติดต่อ',
    name: 'ชื่อ',
    company: 'ชื่อบริษัท',
    phone: 'เบอร์โทร',
    email: 'อีเมล',
    problems: 'ปัญหาที่เลือก',
    filterAll: 'ทั้งหมด',
    filterNotContacted: 'ยังไม่ติดต่อ',
    filterContacted: 'ติดต่อแล้ว',
    userContactsLabel: 'ผู้ใช้งานกดติดต่อ',
    exhibitorContactsLabel: 'Exhibitor กดติดต่อแล้ว',
    pdpaTitle: 'นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    pdpaMessage:
      'เพื่อความปลอดภัยและเป็นไปตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) กรุณาอ่านและยอมรับนโยบายก่อนใช้งานแดชบอร์ดสำหรับ Exhibitor',
    pdpaNote: 'หากท่านไม่ได้ทำเครื่องหมายยินยอมตาม PDPA ระบบจะแสดงเฉพาะรายชื่อบริษัทที่ตรงกับการแมตช์ให้เท่านั้น และจะไม่ส่งข้อมูลส่วนบุคคลของท่านให้กับบริษัทใด ๆ',
    pdpaViewPolicy: 'ดูนโยบายฉบับเต็ม',
    pdpaAccept: 'ฉันยอมรับและต้องการเริ่มใช้งาน',
  },
  JP: {
    dashboard: 'ダッシュボード',
    tabs: ['ダッシュボード', 'プロフィール'],
    searchPlaceholder: '検索...',
    totalInterests: '総参加者',
    totalInterestsValue: '3,256',
    matched: 'マッチ',
    matchedValue: '394',
    notMatched: '非マッチ',
    notMatchedValue: '2,536',
    contacts: '連絡先',
    contactsValue: '38',
    trendTitle: '人々が関心を持つ問題',
    trendOutpatients: 'マッチ',
    trendInpatients: '未連絡',
    patientsByCategory: 'カテゴリ別興味',
    timeAdmitted: '連絡時間',
    divisionLabel: 'カテゴリ',
    patientsLabel: '数',
    logout: 'ログアウト',
    export: 'Export',
    tableNo: '番号',
    tableName: '興味のある名前',
    tableContact: '連絡先',
    details: '詳細',
    contact: '連絡',
    contacted: '連絡済み',
    notContacted: '未連絡',
    name: '名前',
    company: '会社名',
    phone: '電話',
    email: 'メール',
    problems: '選択された問題',
    filterAll: 'すべて',
    filterNotContacted: '未連絡',
    filterContacted: '連絡済み',
    userContactsLabel: 'ユーザー連絡',
    exhibitorContactsLabel: '出展者連絡済み',
    pdpaTitle: 'プライバシーポリシー／個人情報保護方針（PDPA）',
    pdpaMessage:
      'セキュリティ確保および個人情報保護法（PDPA）遵守のため、出展者ダッシュボードをご利用いただく前に、ポリシーを確認し同意してください。',
    pdpaNote: 'PDPAに同意しない場合、システムはマッチングした会社名のみを表示し、お客様の個人情報をいかなる会社にも送信しません。',
    pdpaViewPolicy: 'ポリシー全文を表示',
    pdpaAccept: '同意してダッシュボードを利用する',
  },
};

export default function ExhibitorDashboardPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [showPdpaModal, setShowPdpaModal] = useState(false);
  const [isPdpaAccepted, setIsPdpaAccepted] = useState(false);
  const [showPdpaContentModal, setShowPdpaContentModal] = useState(false);
  const [hasViewedPdpa, setHasViewedPdpa] = useState(false);
  const [canAcceptPdpa, setCanAcceptPdpa] = useState(false);
  const [pdpaContent, setPdpaContent] = useState(null);
  const pdpaContentRef = useRef(null);

  useEffect(() => {
    const storedLanguage =
      typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
    if (storedLanguage) {
      const foundOption = languageOptions.find((option) => option.code === storedLanguage);
      if (foundOption) {
        setSelectedLanguage(foundOption);
      }
    }

    const handleClickOutside = (event) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check PDPA acceptance for exhibitor
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if user is logged in as exhibitor
    const userRole = localStorage.getItem('userRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || userRole !== 'exhibitor') {
      // Not logged in or not an exhibitor, don't show modal
      setShowPdpaModal(false);
      return;
    }
    
    // Check if exhibitor has accepted PDPA for dashboard
    const exhibitorAccepted = localStorage.getItem('exhibitorPdpaAccepted') === 'true';
    
    if (exhibitorAccepted) {
      setIsPdpaAccepted(true);
      setShowPdpaModal(false);
    } else {
      setIsPdpaAccepted(false);
      setShowPdpaModal(true);
    }
  }, []);

  // Fetch data from Firebase userPanelSubmissions
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (typeof window === 'undefined') return;
      
      const currentUsername = localStorage.getItem('userId');
      if (!currentUsername) return;

      try {
        // Fetch userPanelSubmissions
        const submissionsRef = collection(db, 'userPanelSubmissions');

        const submissionsQuery = query(
              submissionsRef, 
              where('exhibitorId', '==', currentUsername) 
        );
        
        // const submissionsQuery = query(submissionsRef);
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        const submissions = [];
        submissionsSnapshot.forEach((doc) => {
          submissions.push({ id: doc.id, ...doc.data() });
        });

        // Fetch contacts (matched data from usermatching page)
        const contactsRef = collection(db, 'userPanelSubmissions');
        const contactsQuery = query(contactsRef);
        const contactsSnapshot = await getDocs(contactsQuery);
        
        const contacts = [];
        contactsSnapshot.forEach((doc) => {
          contacts.push({ id: doc.id, ...doc.data() });
        });

        // Calculate category counts
        const categoryCounts = {};
        submissions.forEach((sub) => {
          if (sub.categories && Array.isArray(sub.categories)) {
            sub.categories.forEach((category) => {
              if (category && category.trim() !== '') {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
              }
            });
          }
        });

        // Convert to array and sort by count (descending)
        const sortedCategories = Object.entries(categoryCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Top 6 categories

        setCategoryData(sortedCategories);

        // Prepare table data from submissions
        const contactMap = new Map();
        contacts.forEach((contact) => {
          const key = contact.submissionId || contact.fullName;
          if (key) {
            contactMap.set(key, contact.id);
          }
        });

        const tableRows = submissions.map((sub, index) => {
          const contactDocId = contactMap.get(sub.id) || contactMap.get(sub.fullName);
          const isContacted = sub.isContacted || false;
          // const isContacted = false;
          // Parse contact to separate phone and email
          const contactStr = sub.contact || '';
          const isEmail = contactStr.includes('@');
          const phone = isEmail ? '' : contactStr;
          const email = isEmail ? contactStr : '';
          
          return {
            id: sub.id,
            no: index + 1,
            name: sub.fullName || 'N/A',
            companyName: sub.companyName || '-',
            phone,
            email,
            categories: sub.categories || [],
            isContacted,
            contactDocId: contactDocId || null,
          };
        });

        setTableData(tableRows);
        updateSummaryFromRows(tableRows, false);
      } catch (error) {
        console.error('Error fetching summary data:', error);
        updateSummaryFromRows([], false);
      }
    };

    fetchSummaryData();
  }, []);

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
    await signOut(auth);
    router.replace('/login')
  };

  // Load PDPA content from Firebase or use default
  useEffect(() => {
    const loadPdpaContent = async () => {
      try {
        const docRef = doc(db, 'pdpaContent', 'active');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.content) {
            const generateContent = (lang) => {
              const content = data.content[lang];
              if (!content) return '';
              
              const sectionLabels = {
                TH: {
                  section1: 'การเก็บรวบรวมข้อมูล',
                  section2: 'การใช้ข้อมูล',
                  section3: 'การเปิดเผยข้อมูล',
                  section4: 'สิทธิของท่าน',
                },
                JP: {
                  section1: 'データの収集',
                  section2: 'データの使用',
                  section3: 'データの開示',
                  section4: 'お客様の権利',
                },
              };
              
              return `
                <h2 class="text-xl font-bold mb-4">${content.subtitle || ''}</h2>
                <p class="mb-4">${content.intro || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">1. ${sectionLabels[lang]?.section1 || ''}</h3>
                <p class="mb-4">${content.section1 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">2. ${sectionLabels[lang]?.section2 || ''}</h3>
                <p class="mb-4">${content.section2 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">3. ${sectionLabels[lang]?.section3 || ''}</h3>
                <p class="mb-4">${content.section3 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">4. ${sectionLabels[lang]?.section4 || ''}</h3>
                <p class="mb-4">${content.section4 || ''}</p>
              `;
            };
            
            setPdpaContent({
              TH: generateContent('TH'),
              JP: generateContent('JP'),
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error loading PDPA content:', error);
      }
      
      // Use default content from pdpa page (full content)
      const defaultPdpaTranslations = {
        TH: {
          content: `
            <h2 class="text-xl font-bold mb-4 text-gray-900">นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล</h2>
            <p class="mb-4 text-gray-900">
              บริษัท ออลต์ ดีไซน์ ออฟฟิศ จำกัด (ต่อไปนี้เรียกว่า "บริษัท") ได้จัดทำนโยบายความเป็นส่วนตัวนี้
              (ต่อไปนี้เรียกว่า "นโยบาย") เพื่ออธิบายวิธีการจัดการข้อมูลส่วนบุคคลของผู้ใช้บนเว็บไซต์ที่บริษัทเป็นผู้ดำเนินการ
              (ต่อไปนี้เรียกว่า "เว็บไซต์") รวมถึงบริการต่าง ๆ ที่บริษัทให้บริการ (ต่อไปนี้เรียกว่า "บริการ")
            </p>
            <p class="mb-4 text-gray-900">
              ในกรณีที่กฎหมายคุ้มครองข้อมูลส่วนบุคคลแห่งราชอาณาจักรไทย ("PDPA") ใช้บังคับ
              โปรดดูข้อกำหนดเฉพาะสำหรับประเทศไทยเพิ่มเติมด้านล่าง
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">ข้อ 1 (ข้อมูลส่วนบุคคล)</h3>
            <p class="mb-4 text-gray-900">
              "ข้อมูลส่วนบุคคล" หมายถึง "ข้อมูลส่วนบุคคล" ตามที่ระบุไว้ในกฎหมายคุ้มครองข้อมูลส่วนบุคคลของประเทศญี่ปุ่น
              และหมายถึงข้อมูลเกี่ยวกับบุคคลซึ่งยังมีชีวิตอยู่ที่สามารถใช้ระบุตัวตนบุคคลได้ เช่น ชื่อ วันเดือนปีเกิด
              ที่อยู่ หมายเลขโทรศัพท์ ข้อมูลติดต่อ หรือข้อมูลอื่น ๆ และรวมถึงข้อมูลลักษณะทางกายภาพ ลายนิ้วมือ เสียง
              และข้อมูลบนบัตรประกันสุขภาพที่สามารถใช้ระบุตัวตนได้ด้วยตัวข้อมูลเอง (Personally Identifiable Information)
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">ข้อ 2 (วิธีเก็บข้อมูลส่วนบุคคล)</h3>
            <p class="mb-4 text-gray-900">
              เมื่อผู้ใช้ใช้บริการ บริษัทอาจขอข้อมูลส่วนบุคคล เช่น ชื่อ วันเกิด ที่อยู่ หมายเลขโทรศัพท์ อีเมล
              หมายเลขบัญชีธนาคาร หมายเลขบัตรเครดิต และหมายเลขใบขับขี่
            </p>
            <p class="mb-4 text-gray-900">
              บริษัทอาจรับข้อมูลธุรกรรมและข้อมูลการชำระเงินจากพันธมิตรของบริษัท (เช่น ผู้ให้บริการข้อมูล ผู้ลงโฆษณา
              และปลายทางจัดส่งโฆษณา; ต่อไปนี้เรียกว่า "พันธมิตร") ซึ่งมีข้อมูลส่วนบุคคลของผู้ใช้
              รวมถึงข้อมูลธุรกรรมระหว่างผู้ใช้และพันธมิตรดังกล่าว
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อ 3 (วัตถุประสงค์ในการเก็บและใช้ข้อมูลส่วนบุคคล)
            </h3>
            <p class="mb-2 text-gray-900">บริษัทใช้งานข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>ให้บริการและดำเนินการบริการ</li>
              <li>ตอบกลับคำถามของผู้ใช้ (รวมถึงการยืนยันตัวตน)</li>
              <li>ส่งอีเมลเกี่ยวกับฟีเจอร์ใหม่ การอัปเดต แคมเปญ หรือข้อมูลบริการอื่นที่ผู้ใช้ใช้อยู่</li>
              <li>ติดต่อผู้ใช้ในกรณีจำเป็น เช่น การบำรุงรักษาหรือประกาศสำคัญ</li>
              <li>ระบุตัวผู้ใช้ที่ละเมิดข้อกำหนดการใช้งาน หรือพยายามใช้บริการอย่างทุจริต และปฏิเสธการใช้บริการ</li>
              <li>เปิดให้ผู้ใช้ดู แก้ไข หรือลบข้อมูลบัญชีของตน รวมถึงตรวจสอบสถานะการใช้งาน</li>
              <li>เรียกเก็บค่าบริการในบริการที่ต้องชำระเงิน</li>
              <li>ใช้เพื่อวัตถุประสงค์อื่นที่เกี่ยวข้องกับข้อข้างต้น</li>
            </ul>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อ 4 (การเปลี่ยนแปลงวัตถุประสงค์การใช้ข้อมูล)
            </h3>
            <p class="mb-4 text-gray-900">
              บริษัทสามารถเปลี่ยนแปลงวัตถุประสงค์การใช้ข้อมูลได้ หากมีเหตุอันสมควรว่าเกี่ยวข้องกับวัตถุประสงค์เดิม
              และการเปลี่ยนแปลงดังกล่าวจะถูกแจ้งให้ผู้ใช้ทราบหรือประกาศบนเว็บไซต์
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อ 5 (การให้ข้อมูลส่วนบุคคลแก่บุคคลที่สาม)
            </h3>
            <p class="mb-2 text-gray-900">
              บริษัทจะไม่เปิดเผยข้อมูลส่วนบุคคลแก่บุคคลที่สามโดยไม่ได้รับความยินยอม เว้นแต่มีข้อยกเว้นดังต่อไปนี้
              หรือเป็นไปตามที่กฎหมายกำหนด
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>เมื่อจำเป็นเพื่อป้องกันอันตรายต่อชีวิต ร่างกาย หรือทรัพย์สิน และไม่สามารถขอความยินยอมได้</li>
              <li>เมื่อจำเป็นเพื่อสาธารณสุขหรือพัฒนาการเด็ก และไม่สามารถขอความยินยอมได้</li>
              <li>
                เมื่อจำเป็นต้องให้ความร่วมมือกับหน่วยงานรัฐเพื่อดำเนินงานตามกฎหมาย
                และการขอความยินยอมอาจเป็นอุปสรรคต่อการดำเนินการดังกล่าว
              </li>
              <li>
                กรณีที่บริษัทเผยแพร่ล่วงหน้าและยื่นแจ้งต่อคณะกรรมาธิการคุ้มครองข้อมูลส่วนบุคคล
                เกี่ยวกับการให้ข้อมูลส่วนบุคคลแก่บุคคลที่สาม ประเภทข้อมูล วิธีการให้ข้อมูล สิทธิในการระงับ
                และวิธีการขอระงับการให้ข้อมูล
              </li>
            </ul>
            <p class="mb-2 text-gray-900">กรณีต่อไปนี้จะไม่ถือว่าเป็น "บุคคลที่สาม":</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>การมอบหมายงานให้ผู้ให้บริการภายนอก</li>
              <li>การโอนกิจการ (เช่น การควบรวมกิจการหรือโอนกิจการทั้งหมดหรือบางส่วน)</li>
              <li>
                การใช้ข้อมูลร่วมกับบุคคลที่กำหนด และมีการแจ้งรายละเอียดให้เจ้าของข้อมูลทราบล่วงหน้า
                ตามที่กฎหมายกำหนด
              </li>
            </ul>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">ข้อ 6 (การเปิดเผยข้อมูลส่วนบุคคล)</h3>
            <p class="mb-2 text-gray-900">
              บริษัทจะเปิดเผยข้อมูลส่วนบุคคลให้เจ้าของข้อมูลเมื่อมีการร้องขอ เว้นแต่มีเหตุผลดังต่อไปนี้:
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>อาจเกิดอันตรายต่อชีวิต ร่างกาย ทรัพย์สิน หรือสิทธิอื่นใดของเจ้าของข้อมูลหรือบุคคลที่สาม</li>
              <li>อาจกระทบต่อการดำเนินธุรกิจของบริษัทอย่างมีนัยสำคัญ</li>
              <li>เป็นการขัดต่อกฎหมายหรือข้อบังคับที่เกี่ยวข้อง</li>
            </ul>
            <p class="mb-4 text-gray-900">
              บริษัทอาจเรียกเก็บค่าธรรมเนียมในการเปิดเผยข้อมูลในอัตรา 1,000 เยนต่อคำขอ
              ทั้งนี้ ข้อมูลประวัติหรือข้อมูลเชิงสถิติที่ไม่สามารถระบุตัวบุคคลได้จะไม่ถือเป็นข้อมูลที่ต้องเปิดเผย
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อ 7 (การแก้ไข หรือลบข้อมูลส่วนบุคคล)
            </h3>
            <p class="mb-4 text-gray-900">
              ผู้ใช้สามารถขอให้บริษัทแก้ไข เพิ่มเติม หรือลบข้อมูลส่วนบุคคลของตนได้
              ในกรณีที่พบว่าข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์ บริษัทจะดำเนินการแก้ไขตามความเหมาะสม
              และจะแจ้งผลให้ผู้ใช้ทราบโดยเร็ว
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อ 8 (การระงับการใช้ข้อมูลส่วนบุคคล)
            </h3>
            <p class="mb-2 text-gray-900">
              บริษัทจะตรวจสอบโดยเร็วหากมีข้อสงสัยหรือคำร้องเรียนว่าข้อมูลส่วนบุคคลถูก:
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>ใช้นอกเหนือจากวัตถุประสงค์ที่ระบุไว้</li>
              <li>เก็บรวบรวมด้วยวิธีการที่ไม่ชอบด้วยกฎหมาย</li>
              <li>ใช้ในทางที่อาจสนับสนุนการกระทำผิดกฎหมาย</li>
              <li>เก็บรักษาไว้นานเกินความจำเป็นตามวัตถุประสงค์</li>
              <li>เกิดเหตุรั่วไหล สูญหาย หรือถูกเข้าถึงโดยไม่ได้รับอนุญาต</li>
              <li>ใช้ในลักษณะที่อาจละเมิดสิทธิหรือเสรีภาพของเจ้าของข้อมูล</li>
            </ul>
            <p class="mb-4 text-gray-900">
              หากพบความจำเป็น บริษัทจะระงับการใช้ หรือลบข้อมูลดังกล่าว และจะแจ้งให้ผู้ใช้ทราบ
              หากการระงับการใช้ข้อมูลทำได้ยาก บริษัทจะใช้มาตรการทดแทนที่เหมาะสมตามสมควร
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อ 9 (การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว)
            </h3>
            <p class="mb-4 text-gray-900">
              บริษัทสามารถปรับปรุงหรือแก้ไขนโยบายนี้ได้โดยไม่ต้องแจ้งผู้ใช้ล่วงหน้า เว้นแต่กฎหมายจะกำหนดเป็นอย่างอื่น
              นโยบายฉบับแก้ไขจะมีผลเมื่อมีการเผยแพร่บนเว็บไซต์ของบริษัท
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">
              ข้อกำหนดเพิ่มเติมสำหรับประเทศไทย (Thailand Regulations)
            </h3>
            <p class="mb-4 text-gray-900">
              ส่วนนี้เป็นข้อกำหนดเพิ่มเติมตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล ("PDPA")
              และในกรณีที่มีความขัดแย้งกับเนื้อหาหลัก ข้อกำหนดในส่วนนี้จะมีผลบังคับใช้ก่อน
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">การจัดการข้อมูลส่วนบุคคล</h4>
            <p class="mb-4 text-gray-900">
              วิธีการจัดการ ระยะเวลาการจัดเก็บ หมวดข้อมูลส่วนบุคคล
              และการเปิดเผยแก่บุคคลที่สามเป็นไปตามที่ระบุไว้ในนโยบายหลักด้านบน
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">ฐานทางกฎหมาย</h4>
            <p class="mb-2 text-gray-900">
              โดยทั่วไป บริษัทใช้ความยินยอมของผู้ใช้เป็นฐานทางกฎหมายในการประมวลผลข้อมูลส่วนบุคคล
              ในกรณีที่ไม่สามารถขอความยินยอมได้อย่างเหมาะสม ฐานทางกฎหมายอาจเป็นดังต่อไปนี้:
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>ความจำเป็นในการทำสัญญา หรือเพื่อดำเนินการตามคำขอของผู้ใช้ก่อนทำสัญญา</li>
              <li>ประโยชน์โดยชอบธรรมของบริษัทหรือบุคคลอื่น</li>
              <li>การปฏิบัติตามกฎหมายหรือข้อบังคับที่บังคับใช้</li>
            </ul>
            <p class="mb-2 text-gray-900">ตัวอย่างผลประโยชน์โดยชอบธรรม เช่น:</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>การเพิ่มประสิทธิภาพทางธุรกิจผ่านการปรับปรุงบริการ</li>
              <li>การเพิ่มความสะดวกและความปลอดภัยในการใช้งานเว็บไซต์และบริการของบริษัท</li>
            </ul>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">การโอนข้อมูลข้ามพรมแดน</h4>
            <p class="mb-4 text-gray-900">
              บริษัทอาจโอนข้อมูลส่วนบุคคลไปยังประเทศญี่ปุ่นหรือประเทศอื่นเมื่อจำเป็นตามสัญญา
              หรือเพื่อการให้บริการ โดยจะใช้มาตรการรักษาความปลอดภัยที่เหมาะสมตามที่กฎหมายกำหนด
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">สิทธิของผู้ใช้ (ตาม PDPA)</h4>
            <p class="mb-2 text-gray-900">ผู้ใช้มีสิทธิตามกฎหมาย ดังต่อไปนี้:</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>ขอเข้าถึงข้อมูลส่วนบุคคลของตน</li>
              <li>ขอให้แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์</li>
              <li>ขอให้ลบข้อมูลส่วนบุคคลในบางกรณี</li>
              <li>จำกัดการประมวลผลข้อมูลส่วนบุคคล</li>
              <li>คัดค้านการประมวลผลข้อมูลส่วนบุคคลในบางกรณี</li>
              <li>ขอรับและโอนย้ายข้อมูล (Data Portability) หากมีสิทธิ์ตามกฎหมาย</li>
            </ul>
            <p class="mb-4 text-gray-900">
              ผู้ใช้สามารถขอใช้สิทธิดังกล่าวได้ผ่านช่องทางการติดต่อที่บริษัทระบุ
              โดยบริษัทจะดำเนินการตามคำขอภายในระยะเวลาที่เหมาะสมตามที่กฎหมายกำหนด
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">การถอนความยินยอม</h4>
            <p class="mb-4 text-gray-900">
              ผู้ใช้สามารถถอนความยินยอมในการประมวลผลข้อมูลส่วนบุคคลได้ทุกเมื่อ
              โดยไม่กระทบต่อความชอบด้วยกฎหมายของการประมวลผลที่ได้ดำเนินการไปแล้วก่อนการถอนความยินยอม
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">สิทธิในการร้องเรียนต่อหน่วยงานกำกับดูแล</h4>
            <p class="mb-4 text-gray-900">
              ผู้ใช้มีสิทธิร้องเรียนต่อหน่วยงานกำกับดูแลที่มีอำนาจในประเทศไทย
              หรือหน่วยงานกำกับดูแลในระดับสากล ตามที่กฎหมายที่เกี่ยวข้องกำหนด
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">ข้อมูลส่วนบุคคลที่จำเป็นในการให้บริการ</h4>
            <p class="mb-2 text-gray-900">ตัวอย่างข้อมูลที่อาจจำเป็นในการให้บริการ ได้แก่:</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>ข้อมูลพื้นฐาน เช่น ชื่อบริษัท ชื่อบุคคลผู้ติดต่อ หมายเลขโทรศัพท์</li>
              <li>ข้อมูลทั้งหมดที่จำเป็นต่อการออกแบบ ผลิต หรือพัฒนาเว็บไซต์และบริการที่เกี่ยวข้อง</li>
            </ul>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">
              การตัดสินใจโดยอัตโนมัติ (รวมถึงการทำโปรไฟล์)
            </h4>
            <p class="mb-4 text-gray-900">
              บริษัทจะไม่ตัดสินใจใด ๆ โดยอาศัยระบบอัตโนมัติ 100% รวมถึงการทำโปรไฟล์
              ที่ส่งผลกระทบอย่างมีนัยสำคัญต่อสิทธิหรือเสรีภาพของผู้ใช้
            </p>
          `,
        },
        JP: {
          content: `
            <h2 class="text-xl font-bold mb-4 text-gray-900">プライバシーポリシー</h2>
            <p class="mb-4 text-gray-900">
              株式会社オルトデザインオフィスおよびAlt Design Office Co,.Ltd.（以下，「当社」といいます。）は，
              当社の運営するウェブサイト（以下，「本ウェブサイト」といいます。）および当社が提供するサービス
              （以下，「当社サービス」といいます。）におけるユーザーの個人情報の取扱いについて，
              以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。
            </p>
            <p class="mb-4 text-gray-900">
              なお、タイ王国が定める個人データ保護法（Personal Data Protection Act、以下、PDPAといいます。）が
              適用される場合には、タイ王国における当社の規定も併せてご確認ください。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第1条（個人情報）</h3>
            <p class="mb-4 text-gray-900">
              「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，生存する個人に関する情報であって，
              当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報
              及び容貌，指紋，声紋にかかるデータ，及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報
              （個人識別情報）を指します。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第2条（個人情報の収集方法）</h3>
            <p class="mb-4 text-gray-900">
              当社は，ユーザーが当社サービスをご利用になる際に、氏名，生年月日，住所，電話番号，メールアドレス，
              銀行口座番号，クレジットカード番号，運転免許証番号などの個人情報をお尋ねすることがあります。
              また，ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を，
              当社の提携先（情報提供元，広告主，広告配信先などを含みます。以下，「提携先」といいます。）などから
              収集することがあります。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第3条（個人情報を収集・利用する目的）</h3>
            <p class="mb-2 text-gray-900">当社が個人情報を収集・利用する目的は，以下のとおりです。</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>当社サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>ユーザーが利用中のサービスの新機能，更新情報，キャンペーン等および当社が提供する他のサービスの案内メールを送付するため</li>
              <li>メンテナンス，重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーを特定し，ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更，削除，ご利用状況の閲覧を行っていただくため</li>
              <li>有料サービスにおいて，ユーザーに利用料金を請求するため</li>
              <li>上記の利用目的に付随する目的</li>
            </ul>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第4条（利用目的の変更）</h3>
            <p class="mb-4 text-gray-900">
              当社は，利用目的が変更前と関連性を有すると合理的に認められる場合に限り，個人情報の利用目的を変更するものとします。
              利用目的の変更を行った場合には，変更後の目的について，当社所定の方法により，ユーザーに通知し，
              または本ウェブサイト上に公表するものとします。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第5条（個人情報の第三者提供）</h3>
            <p class="mb-2 text-gray-900">
              当社は，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。
              ただし，個人情報保護法その他の法令で認められる場合を除きます。
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって，本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって，本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              <li>
                あらかじめ次の事項を告知あるいは公表し，かつ当社が個人情報保護委員会に届出をしたとき：
                利用目的に第三者への提供を含むこと／第三者に提供されるデータの項目／第三者への提供の手段または方法／
                本人の求めに応じて個人情報の第三者への提供を停止すること／本人の求めを受け付ける方法
              </li>
            </ul>
            <p class="mb-2 text-gray-900">前項の定めにかかわらず，次に掲げる場合には，当該情報の提供先は第三者に該当しないものとします。</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
              <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
              <li>
                個人情報を特定の者との間で共同して利用する場合であって，その旨並びに共同して利用される個人情報の項目，
                共同して利用する者の範囲，利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について，
                あらかじめ本人に通知し，または本人が容易に知り得る状態に置いた場合
              </li>
            </ul>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第6条（個人情報の開示）</h3>
            <p class="mb-2 text-gray-900">
              当社は，本人から個人情報の開示を求められたときは，本人に対し，遅滞なくこれを開示します。
              ただし，開示することにより次のいずれかに該当する場合は，その全部または一部を開示しないこともあり，
              開示しない決定をした場合には，その旨を遅滞なく通知します。
              なお，個人情報の開示に際しては，1件あたり1,000円の手数料を申し受けます。
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>本人または第三者の生命，身体，財産その他の権利利益を害するおそれがある場合</li>
              <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
              <li>その他法令に違反することとなる場合</li>
            </ul>
            <p class="mb-4 text-gray-900">
              前項の定めにかかわらず，履歴情報および特性情報などの個人情報以外の情報については，原則として開示いたしません。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第7条（個人情報の訂正および削除）</h3>
            <p class="mb-4 text-gray-900">
              ユーザーは，当社の保有する自己の個人情報が誤った情報である場合には，当社が定める手続きにより，
              当社に対して個人情報の訂正，追加または削除（以下，「訂正等」といいます。）を請求することができます。
              当社は，ユーザーから当該請求を受けてその請求に応じる必要があると判断した場合には，遅滞なく，
              当該個人情報の訂正等を行い，その結果をユーザーに通知します。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第8条（個人情報の利用停止等）</h3>
            <p class="mb-2 text-gray-900">
              当社は，本人から，個人情報が以下のいずれかの理由によりその利用の停止または消去
              （以下，「利用停止等」といいます。）を求められた場合には，遅滞なく必要な調査を行います。
              前項の調査結果に基づき，その請求に応じる必要があると判断した場合には，遅滞なく，当該個人情報の利用停止等を行います。
              当社は，本人から，当社が保有する個人情報が誤った情報であるという理由により，その訂正または削除を求められた場合には，
              他の法令の規定により特別の手続きが定められている場合を除き，遅滞なく必要な調査を行います。
              前項の調査結果に基づき，その請求に応じる必要があると判断した場合には，遅滞なく，当該個人情報の訂正または削除を行います。
              当社は，前2項の規定に基づき利用停止等または訂正等を行った場合，または利用停止等または訂正等を行わない旨の決定をした場合には，
              これを遅滞なく本人に通知します。
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>利用目的の達成，利用の必要がなくなったとき</li>
              <li>当社が行った利用停止等の措置に起因して生じた損害の賠償について，当社は一切の責任を負いません。</li>
            </ul>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">第9条（プライバシーポリシーの変更）</h3>
            <p class="mb-4 text-gray-900">
              本ポリシーの内容は，法令その他本ポリシーに別段の定めのある事項を除いて，ユーザーに通知することなく，変更することができるものとします。
              当社が別途定める場合を除いて，変更後のプライバシーポリシーは，本ウェブサイトに掲載したときから効力を生じるものとします。
            </p>

            <h3 class="text-lg font-semibold mb-2 mt-6 text-gray-900">タイ王国における追加規定（Thailand Regulations）</h3>
            <p class="mb-4 text-gray-900">
              本セクションは，タイ王国が定める個人データ保護法（Personal Data Protection Act，以下，PDPAといいます。）に基づく追加規定であり，
              本ポリシーの他の部分と矛盾する場合，本セクションの規定が優先されます。
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">個人情報の管理</h4>
            <p class="mb-4 text-gray-900">
              個人情報の管理方法，保存期間，個人情報のカテゴリ，および第三者への開示については，上記の本ポリシーに記載されているとおりです。
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">法的根拠</h4>
            <p class="mb-2 text-gray-900">
              一般的に，当社はユーザーの同意を個人情報の処理の法的根拠として使用します。
              適切に同意を得ることができない場合，法的根拠は以下のいずれかである場合があります：
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>契約の履行または契約締結前のユーザーの要求に応じた措置の実行に必要である場合</li>
              <li>当社または他の者の正当な利益</li>
              <li>適用される法律または規制の遵守</li>
            </ul>
            <p class="mb-2 text-gray-900">正当な利益の例には，以下が含まれます：</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>サービスの改善を通じたビジネス効率の向上</li>
              <li>当社のウェブサイトおよびサービスの利便性とセキュリティの向上</li>
            </ul>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">個人情報の第三国への移転</h4>
            <p class="mb-4 text-gray-900">
              当社は、ユーザーとの契約の履行のため、または契約締結前のユーザーの求めに応じた手続きの履践のために、
              日本国以外で取得した個人情報を日本国または第三国へ移転することがあります。
              ユーザーの個人情報を第三国へ移転する場合、当社は適切なセキュリティ及び秘密保持の措置を用いて
              ユーザーの個人情報を取り扱います。
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">ユーザーの権利</h4>
            <p class="mb-2 text-gray-900">
              ユーザーは、当社に対して法令等に基づく以下の権利を有しています。
              ユーザーは、個人情報保護に関する問い合わせ窓口に連絡することにより、これらの権利を行使することができます。
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>個人情報へのアクセスの権利</li>
              <li>個人情報の訂正の権利</li>
              <li>個人情報の消去の権利</li>
              <li>個人情報の利用の制限の権利</li>
              <li>個人情報の利用への異議申立ての権利</li>
              <li>データポータビリティの権利</li>
            </ul>
            <p class="mb-4 text-gray-900">
              当社は、これらの権利の行使を受けた場合には、法令等に定められた例外事由に該当しない限り、
              ユーザーであることを確認した上で誠実に対応します。
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">同意の撤回</h4>
            <p class="mb-4 text-gray-900">
              ユーザーは、いつでも個人情報の利用に関する同意を撤回できます。
              その同意の撤回は、撤回前の同意に基づく個人情報の利用の合法性に影響を与えません。
              ユーザーは、個人情報保護に関する問い合わせ窓口に連絡することにより、同意を撤回することができます。
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">監督機関への不服申し立て</h4>
            <p class="mb-4 text-gray-900">
              ユーザーは、当社の個人情報の取扱いについて、法令等に従って、国、地域または国際組織等の監督機関に
              不服を申し立てることができます。
            </p>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">サービス提供のために必要な個人情報</h4>
            <p class="mb-2 text-gray-900">当社は、ユーザーに対してサービスを提供するために、以下の情報を必要とします。</p>
            <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-900">
              <li>基本情報（会社名、氏名、電話番号等）</li>
              <li>ウェブサイト制作において必要となる全ての情報</li>
            </ul>

            <h4 class="text-base font-semibold mb-2 mt-4 text-gray-900">プロファイリングなどの自動化された意思決定</h4>
            <p class="mb-4 text-gray-900">
              当社は、個人情報のプロファイリングなどの自動化された取扱いのみに基づいた意思決定を行うことはありません。
            </p>
          `,
        },
      };
      
      setPdpaContent({
        TH: defaultPdpaTranslations.TH.content,
        JP: defaultPdpaTranslations.JP.content,
      });
    };
    
    loadPdpaContent();
  }, []);

  // Scroll detection for PDPA content modal
  useEffect(() => {
    if (!showPdpaContentModal || !pdpaContentRef.current) return;
    
    const contentElement = pdpaContentRef.current;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setCanAcceptPdpa(isScrolledToBottom);
    };
    
    contentElement.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();
    
    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
    };
  }, [showPdpaContentModal]);

  const handleViewPolicy = () => {
    setShowPdpaContentModal(true);
    setHasViewedPdpa(true);
  };

  const handlePdpaContentAccept = () => {
    if (canAcceptPdpa) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pdpaAccepted', 'true');
        localStorage.setItem('exhibitorPdpaAccepted', 'true');
      }
      setIsPdpaAccepted(true);
      setShowPdpaModal(false);
      setShowPdpaContentModal(false);
    }
  };

  const handleExhibitorPdpaAccept = () => {
    if (!hasViewedPdpa) {
      handleViewPolicy();
      return;
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('pdpaAccepted', 'true');
      localStorage.setItem('exhibitorPdpaAccepted', 'true');
    }
    setIsPdpaAccepted(true);
    setShowPdpaModal(false);
  };

  const handleExportPDF = async () => {
    // 1) import jsPDF แบบ dynamic กัน error window is not defined
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
  
    // 2) ใช้ text ที่จะใส่ใน PDF
    const pdfT = translations[selectedLanguage.code];

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const sectionSpacing = 15;
    const cardHeight = 25;
    const cardSpacing = 10;
  
    // ... ที่เหลือใน handleExportPDF ของคุณใช้ได้เหมือนเดิม ...
  }

  // ฟังก์ชัน Export เป็น Excel (ดึงมาจาก ExportButtons.tsx)
  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const FileSaver = await import("file-saver");

    // แปลง tableData เป็นข้อมูลสำหรับ Excel
    const excelData = tableData.map((row) => ({
      ID: row.no || row.id,
      Name: row.name || '',
      Company: row.companyName || '',
      Email: row.email || '',
      Phone: row.phone || '',
      Categories: row.categories && row.categories.length > 0 ? row.categories.join(', ') : '',
      Contacted: row.isContacted ? 'Yes' : 'No',
    }));

    // แปลง data เป็น worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Data");

    // เขียนไฟล์เป็น binary
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    FileSaver.default.saveAs(data, `exhibitor-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const updateSummaryFromRows = (rows, loading = false) => {
    const contactedCount = rows.filter((row) => row.isContacted).length;
    setSummaryData({
      totalInterests: rows.length,
      matched: contactedCount,
      notMatched: Math.max(rows.length - contactedCount, 0),
      contacts: contactedCount,
      loading,
    });
  };

  const handleContactClick = async (row) => {
    try {
      if (row.isContacted) {
        // Remove contact
        if (row.contactDocId) {
          const washingtonRef = await doc(db, 'userPanelSubmissions', row.contactDocId);
          await updateDoc(washingtonRef, {
            isContacted : false,
          });
        }
        setTableData((prevData) => {
          const updated = prevData.map((item) =>
            item?.id === row.id ? { ...item, isContacted: false } : item
          );
          updateSummaryFromRows(updated);
          return updated;
        });
      } else {
        // Save contact to Firebase
        const washingtonRef = await doc(db, 'userPanelSubmissions', row.contactDocId);
        const docRef = await updateDoc(washingtonRef, {
          isContacted : true,
        });

        // Update local state
        setTableData((prevData) => {
          const updated = prevData.map((item) =>
            item?.id === row.id ? { ...item, isContacted: true } : item
          );
          updateSummaryFromRows(updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName] = useState('Emma Kwan');
  
  // Summary Cards data
  const [summaryData, setSummaryData] = useState({
    totalInterests: 0,
    matched: 0,
    notMatched: 0,
    contacts: 0,
    loading: true,
  });

  // Category data for bar chart
  const [categoryData, setCategoryData] = useState([]);
  
  // Table data
  const [tableData, setTableData] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [tableFilter, setTableFilter] = useState('all'); // 'all', 'notContacted', 'contacted'

  // Sample data for charts
  const trendData = [
    { month: 'Oct', matched: 1200, notContacted: 800 },
    { month: 'Nov', matched: 1800, notContacted: 1200 },
    { month: 'Dec', matched: 2100, notContacted: 1500 },
    { month: 'Jan', matched: 2400, notContacted: 1800 },
    { month: 'Feb', matched: 2800, notContacted: 2100 },
    { month: 'Mar', matched: 3200, notContacted: 2400 },
  ];


  const timeData = [
    { time: '07', value: 45 },
    { time: '08', value: 113 },
    { time: '09', value: 85 },
    { time: '10', value: 92 },
    { time: '11', value: 78 },
    { time: '12', value: 95 },
  ];

  const userContactCount = tableData.length;
  const exhibitorContactCount = tableData.filter((row) => row.isContacted).length;
  const contactComparisonTotal = userContactCount + exhibitorContactCount;
  const userContactRatio =
    contactComparisonTotal > 0 ? userContactCount / contactComparisonTotal : 0;
  const exhibitorContactRatio =
    contactComparisonTotal > 0 ? exhibitorContactCount / contactComparisonTotal : 0;
  const circumference = 2 * Math.PI * 40;
  const userDashArray = `${circumference * userContactRatio} ${circumference}`;
  const exhibitorDashArray = `${circumference * exhibitorContactRatio} ${circumference}`;
  const exhibitorOffset = -circumference * userContactRatio;
  const userPercentage = Math.round(userContactRatio * 100);
  const exhibitorPercentage = Math.round(exhibitorContactRatio * 100);

  return (
    <div className={`min-h-screen bg-[#f5f5f5] flex ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-[1440px] mx-auto flex relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[250px] bg-white border-r border-gray-200 flex-col transform transition-transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } md:flex`}
        >
          {/* Logo */}
          <div className="px-4 py-4 items-center justify-center flex">
            <Image src="/logo.svg" alt="alt design office" width={110} height={60} priority />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4">
            <div className="flex flex-col gap-2">
              {t.tabs.map((tab, idx) => {
                const targetTab = idx === 0 ? 'dashboard' : 'profile';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(targetTab);
                      if (targetTab === 'profile') {
                        router.push('/exhibitor-profile');
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === targetTab
                        ? 'bg-gray-100 text-gray-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Image
                      src={idx === 0 ? '/dashboard.png' : '/user.png'}
                      alt={tab}
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    {tab}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            {/* Dashboard Title */}
            <h1 className="text-4xl font-bold text-gray-900">{t.dashboard}</h1>
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-end justify-end  w-full">
              <div className="relative" ref={languageDropdownRef}>
                <div className="flex items-end justify-end gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="bg-gray-800 text-white rounded-lg px-3 h-[36px] flex items-center justify-center gap-2 hover:bg-gray-700 transition"
                    aria-label={t.export}
                    title={t.export}
                  >
                    <Image
                      src="/import-export.png"
                      alt={t.export}
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px] brightness-0 invert"
                    />
                    <span className="text-sm">{t.export} PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="bg-gray-800 text-white rounded-lg px-3 h-[36px] flex items-center justify-center gap-2 hover:bg-gray-700 transition"
                    aria-label="Export Excel"
                    title="Export Excel"
                  >
                    <Image
                      src="/import-export.png"
                      alt="Export Excel"
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px] brightness-0 invert"
                    />
                    <span className="text-sm">{t.export} Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLanguageOpen((prev) => !prev)}
                    className="bg-gray-800 text-white rounded-lg w-[72px] h-[36px] text-sm flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
                  >
                    {selectedLanguage.code}
                    <svg width="12" height="8" fill="none" viewBox="0 0 12 8">
                      <path
                        d="M1 1l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-gray-800 text-white rounded-xl w-[40px] h-[36px] flex items-center justify-center hover:bg-gray-700 transition"
                    aria-label={t.logout}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M15 12H3M12 9l3 3-3 3M9 7V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {isLanguageOpen && (
                  <ul
                    className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
                    role="listbox"
                  >
                    {languageOptions.map((option) => (
                      <li key={option.code}>
                        <button
                          type="button"
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                            selectedLanguage.code === option.code
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handleLanguageSelect(option)}
                        >
                          <span>{option.label}</span>
                          <span className="font-semibold">{option.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="flex-1 overflow-auto p-4 md:p-4 bg-[#f5f5f5] ">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8 ">
              {/* Total Interests */}
              <div className="bg-white p-6 shadow-sm relative rounded-l-2xl">
                <div className="absolute top-4 right-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-800">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : summaryData.totalInterests.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.totalInterests}</p>
                  </div>
                </div>
              </div>

              {/* Matched */}
              <div className="bg-white  p-6 shadow-sm relative">
                <div className="absolute top-4 right-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-800">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : summaryData.matched.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.matched}</p>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-white  p-6 shadow-sm relative rounded-r-2xl">
                <div className="absolute top-4 right-4">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-800">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {summaryData.loading ? '...' : summaryData.contacts.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">{t.contacts}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm ">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{t.trendTitle}</h3>
                </div>
                <div className="h-[200px] flex items-end justify- gap-4">
                  {categoryData.length > 0 ? (
                    categoryData.map((item, index) => {
                      const maxCount = Math.max(...categoryData.map((c) => c.count), 1);
                      return (
                        <div key={item.name} className="w-16 flex flex-col items-center gap-2">
                          <div className="w-full flex items-end justify-center h-[150px]">
                            <div
                              className="w-full rounded-t"
                              style={{ 
                                height: `${(item.count / maxCount) * 100}%`,
                                backgroundColor: '#1E2939'
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 text-center px-1 break-words">
                            {item.name}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">{item.count}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full text-center text-gray-500 py-8">
                      {summaryData.loading ? 'Loading...' : 'No data available'}
                    </div>
                  )}
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#1E2939"
                      strokeWidth="8"
                      strokeDasharray={userDashArray}
                      strokeDashoffset={0}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray={exhibitorDashArray}
                      strokeDashoffset={exhibitorOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-600">
                    {userPercentage}% {t.userContactsLabel} ({userContactCount})
                  </p>
                  <p className="text-sm text-gray-600">
                    {exhibitorPercentage}% {t.exhibitorContactsLabel} ({exhibitorContactCount})
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {/* Filter Buttons */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tableFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-transparent text-gray-900 hover:text-gray-700'
                  }`}
                >
                  {t.filterAll}
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('notContacted')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tableFilter === 'notContacted'
                      ? 'bg-gray-800 text-white'
                      : 'bg-transparent text-gray-900 hover:text-gray-700'
                  }`}
                >
                  {t.filterNotContacted}
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('contacted')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tableFilter === 'contacted'
                      ? 'bg-gray-800 text-white'
                      : 'bg-transparent text-gray-900 hover:text-gray-700'
                  }`}
                >
                  {t.filterContacted}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{t.tableNo}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{t.tableName}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{t.tableContact}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredData = tableData.filter((row) => {
                        if (tableFilter === 'all') return true;
                        if (tableFilter === 'contacted') return row.isContacted;
                        if (tableFilter === 'notContacted') return !row.isContacted;
                        return true;
                      });
                      return filteredData.length > 0 ? (
                        filteredData.map((row, index) => {
                          const isExpanded = expandedRows.has(row.id);
                          return (
                            <>
                              <tr key={row.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-700">{row.no}</td>
                                <td className="py-3 px-4 text-sm text-gray-700">{row.name}</td>
                                <td className="py-3 px-1">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleRow(row.id)}
                                      className="px-3 h-[36px] text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                                    >
                                      {t.details}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleContactClick(row)}
                                      className={`px-3 h-[36px] text-sm font-medium rounded-lg transition flex items-center justify-center ${
                                        row.isContacted
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : 'text-white hover:opacity-90'
                                      }`}
                                      style={
                                        !row.isContacted
                                          ? { backgroundColor: '#1E2939' }
                                          : {}
                                      }
                                    >
                                      {row.isContacted ? t.contacted : t.contact}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${row.id}-details`} className="border-b border-gray-100 bg-gray-50">
                                  <td colSpan="3" className="py-4 px-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">{t.name}</p>
                                        <p className="text-sm text-gray-900 font-medium">{row.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">{t.company}</p>
                                        <p className="text-sm text-gray-900 font-medium">{row.companyName}</p>
                                      </div>
                                      {row.phone && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">{t.phone}</p>
                                          <p className="text-sm text-gray-900">{row.phone}</p>
                                        </div>
                                      )}
                                      {row.email && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">{t.email}</p>
                                          <p className="text-sm text-gray-900">{row.email}</p>
                                        </div>
                                      )}
                                      {row.categories.length > 0 && (
                                        <div className="md:col-span-2">
                                          <p className="text-xs text-gray-500 mb-2">{t.problems}</p>
                                          <div className="flex flex-wrap gap-2">
                                            {row.categories.map((category, catIndex) => (
                                              <span
                                                key={catIndex}
                                                className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full"
                                              >
                                                {category}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" className="py-8 text-center text-gray-500">
                            {summaryData.loading ? 'Loading...' : 'No data available'}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
      {showPdpaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 sm:p-7">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">
              {t.pdpaTitle}
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-4 text-left">
              {t.pdpaMessage}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed whitespace-pre-line">
                {t.pdpaNote}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
              <button
                type="button"
                onClick={handleViewPolicy}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                {t.pdpaViewPolicy}
              </button>
              <button
                type="button"
                onClick={handleExhibitorPdpaAccept}
                disabled={!hasViewedPdpa}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                  hasViewedPdpa
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t.pdpaAccept}
              </button>
            </div>
          </div>
        </div>
      )}
      {showPdpaContentModal && pdpaContent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col">
            <div className="p-6 sm:p-7 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                {selectedLanguage.code === 'TH' ? 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA)' : 'プライバシーポリシーおよび個人情報保護方針（PDPA）'}
              </h2>
            </div>
            <div
              ref={pdpaContentRef}
              className="flex-1 overflow-y-auto p-6 sm:p-7"
              style={{
                fontFamily: selectedLanguage.code === 'TH' ? promptFont.style.fontFamily : sawarabiFont.style.fontFamily,
              }}
            >
              <div
                className="max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1 [&_li]:mb-1"
                dangerouslySetInnerHTML={{
                  __html: pdpaContent[selectedLanguage.code] || pdpaContent.TH,
                }}
              />
            </div>
            <div className="p-6 sm:p-7 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowPdpaContentModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  {selectedLanguage.code === 'TH' ? 'ปิด' : '閉じる'}
                </button>
                <button
                  type="button"
                  onClick={handlePdpaContentAccept}
                  disabled={!canAcceptPdpa}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-full text-sm font-semibold transition ${
                    canAcceptPdpa
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {selectedLanguage.code === 'TH' ? 'ฉันยอมรับและต้องการเริ่มใช้งาน' : '同意してダッシュボードを利用する'}
                </button>
              </div>
              {!canAcceptPdpa && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {selectedLanguage.code === 'TH' 
                    ? 'กรุณาเลื่อนอ่านเนื้อหาจนถึงท้ายสุดก่อนยอมรับ' 
                    : '同意するには、最後までスクロールして内容を確認してください'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

