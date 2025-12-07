'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Sidebar from '@/app/components/sidebar';
import { useLanguage } from '@/app/contexts/LanguageProvider';
import translations from '@/app/components/translations';



const promptFont = localFont({
  src: [
    { path: '../../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [{ path: '../../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' }],
});

export default function UserSessionsPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState('userSessions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const {language, toggleLanguage} = useLanguage();
const [selectedLanguage, setSelectedLanguage] = useState(language);
const t = translations[selectedLanguage.code];

useEffect(() => {
  setSelectedLanguage(language);
}, [language]);
  // Sessions data
  const [sessionsData, setSessionsData] = useState({
    sessions: [],
    loading: true,
  });

  // 🔍 search term สำหรับค้นหาชื่อผู้ใช้
  const [searchTerm, setSearchTerm] = useState('');

  const currentFontClass = selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

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

  // Fetch sessions data from Firebase
  useEffect(() => {
    const fetchSessionsData = async () => {
      try {
        // Fetch users data (registration)
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        const usersList = usersSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            username: data.username || '-',
            role: data.role || '-',
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null,
            type: 'user',
          };
        });

        // Fetch userPanelSubmissions data (visitor registration)
        const submissionsRef = collection(db, 'userPanelSubmissions');
        const submissionsSnapshot = await getDocs(submissionsRef);

        const visitorsList = submissionsSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            username: data.fullName || data.companyName || '-',
            role: 'visitor',
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : null,
            type: 'visitor',
          };
        });

        // Combine both lists
        const combinedList = [...usersList, ...visitorsList];

        // Sort by createdAt (newest first)
        combinedList.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt - a.createdAt;
        });

        setSessionsData({
          sessions: combinedList,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching sessions data:', error);
        setSessionsData({
          sessions: [],
          loading: false,
        });
      }
    };

    fetchSessionsData();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'userManagement') {
      router.push('/admin-dashboard/user-management');
    } else if (tab === 'problemTagManagement') {
      router.push('/admin-dashboard/problem-tag-management');
    } else if (tab === 'dashboard') {
      router.push('/admin-dashboard');
    }
  };

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    localStorage.setItem('selectedLanguage', option.code);
    setIsLanguageOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString(selectedLanguage.code === 'TH' ? 'th-TH' : 'ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 🔍 ฟิลเตอร์ sessions ตาม searchTerm (ค้นจาก username)
  const filteredSessions = sessionsData.sessions.filter((session) => {
    if (!searchTerm.trim()) return true;
    const keyword = searchTerm.toLowerCase().trim();
    const name = (session.username || '').toLowerCase();
    return name.includes(keyword);
  });

  const searchPlaceholder =
    selectedLanguage.code === 'TH'
      ? 'ค้นหาชื่อผู้ใช้...'
      : 'ユーザー名を検索...';

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

       
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            {/* Page Title */}
            <h1 className="text-4xl font-bold text-gray-900 whitespace-nowrap">User Sessions</h1>
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

            <div className="flex items-end justify-end w-full">
              <div className="relative" ref={languageDropdownRef}>
                <div className="flex items-end justify-end gap-3 cursor-pointer">
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-4 bg-[#f5f5f5]">
            {/* Sessions Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedLanguage.code === 'TH' ? 'รายการเซสชันผู้ใช้' : 'ユーザーセッション一覧'}
                  </h2>
                  {/* 🔍 Search Input */}
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {sessionsData.loading ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">
                    {selectedLanguage.code === 'TH' ? 'กำลังโหลด...' : '読み込み中...'}
                  </p>
                </div>
              ) : sessionsData.sessions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">
                    {selectedLanguage.code === 'TH' ? 'ไม่พบข้อมูลเซสชัน' : 'セッションデータが見つかりません'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {filteredSessions.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-gray-500 text-sm">
                        {selectedLanguage.code === 'TH'
                          ? 'ไม่พบข้อมูลที่ตรงกับคำค้น'
                          : '検索条件に一致するデータがありません'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            {selectedLanguage.code === 'TH' ? 'ลำดับ' : '番号'}
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            {selectedLanguage.code === 'TH' ? 'ชื่อผู้ใช้' : 'ユーザー名'}
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            {selectedLanguage.code === 'TH' ? 'สิทธิ์การใช้งาน' : '役割'}
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            {selectedLanguage.code === 'TH' ? 'เวลาที่ลงทะเบียน/ล็อกอิน' : '登録/ログイン時刻'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSessions.map((session, index) => (
                          <tr
                            key={session.id}
                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-3 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                              {session.username}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  session.role === 'visitor'
                                    ? 'bg-green-100 text-green-800'
                                    : session.role === 'organizer'
                                    ? 'bg-purple-100 text-purple-800'
                                    : session.role === 'exhibitor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {session.role === 'visitor'
                                  ? selectedLanguage.code === 'TH'
                                    ? 'Visitor'
                                    : '来場者'
                                  : session.role === 'organizer'
                                  ? selectedLanguage.code === 'TH'
                                    ? 'admin'
                                    : '主催者'
                                  : session.role === 'exhibitor'
                                  ? selectedLanguage.code === 'TH'
                                    ? 'Exhibitor'
                                    : '出展者'
                                  : session.role}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {formatDate(session.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
