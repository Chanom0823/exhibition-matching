'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    tabs: ['DashBoard', 'Profile'],
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
  },
  EN: {
    dashboard: 'Dashboard',
    tabs: ['DashBoard', 'Profile'],
    searchPlaceholder: 'Search...',
    totalInterests: 'Total Participants',
    totalInterestsValue: '3,256',
    matched: 'Matched',
    matchedValue: '394',
    notMatched: 'Not Matched',
    notMatchedValue: '2,536',
    contacts: 'Contacts',
    contactsValue: '38',
    trendTitle: 'Problems People Are Interested In',
    trendOutpatients: 'Matched',
    trendInpatients: 'Not Contacted',
    patientsByCategory: 'Interests by Category',
    timeAdmitted: 'Contact Time',
    divisionLabel: 'Category',
    patientsLabel: 'Count',
    logout: 'Logout',
    export: 'Export',
    tableNo: 'No.',
    tableName: 'Interested Name',
    tableContact: 'Contact',
    details: 'Details',
    contact: 'Contact',
    contacted: 'Contacted',
    notContacted: 'Not Contacted',
    name: 'Name',
    company: 'Company',
    phone: 'Phone',
    email: 'Email',
    problems: 'Selected Problems',
    filterAll: 'All',
    filterNotContacted: 'Not Contacted',
    filterContacted: 'Contacted',
    userContactsLabel: 'User Contacts',
    exhibitorContactsLabel: 'Exhibitor Contacted',
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
  },
};

export default function ExhibitorDashboardPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);

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

  // Fetch data from Firebase userPanelSubmissions
  useEffect(() => {
    const fetchSummaryData = async (currentUsername) => {
      try {
        // Fetch userPanelSubmissions
        const submissionsRef = collection(db, 'userPanelSubmissions');

        const submissionsQuery = query(
              submissionsRef, 
              where('username', '==', currentUsername) 
        );
        
        // const submissionsQuery = query(submissionsRef);
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        const submissions = [];
        submissionsSnapshot.forEach((doc) => {
          submissions.push({ id: doc.id, ...doc.data() });
        });

        // Fetch contacts (matched data from usermatching page)
        const contactsRef = collection(db, 'contacts');
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
          const isContacted = Boolean(contactDocId);
          // Parse contact to separate phone and email
          const contactStr = sub.contact || '';
          const isEmail = contactStr.includes('@');
          const phone = isEmail ? '' : contactStr;
          const email = isEmail ? contactStr : '';
          
          return {
            id: sub.id,
            no: index + 1,
            name: sub.fullName || 'N/A',
            companyName: sub.companyName || 'N/A',
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
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
          await deleteDoc(doc(db, 'contacts', row.contactDocId));
        }

        setTableData((prevData) => {
          const updated = prevData.map((item) =>
            item.id === row.id ? { ...item, isContacted: false, contactDocId: null } : item
          );
          updateSummaryFromRows(updated);
          return updated;
        });
      } else {
        // Save contact to Firebase
        const docRef = await addDoc(collection(db, 'contacts'), {
          submissionId: row.id,
          fullName: row.name,
          companyName: row.companyName,
          createdAt: serverTimestamp(),
        });

        // Update local state
        setTableData((prevData) => {
          const updated = prevData.map((item) =>
            item.id === row.id ? { ...item, isContacted: true, contactDocId: docRef.id } : item
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
                    <span className="text-sm">{t.export}</span>
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
    </div>
  );
}

