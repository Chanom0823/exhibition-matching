'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';

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

const translations = {
  TH: {
    dashboard: 'Dashboard',
    tabs: ['DashBoard', 'User Management', 'Problem Tag Management', 'Homepage Management', 'PDPA Management'],
    searchPlaceholder: 'Search...',
    logout: 'ออกจากระบบ',
    export: 'Export',
    pageTitle: 'Homepage Management',
    heroSection: 'ส่วน Hero Banner',
    statsSection: 'ไฮไลท์บนหน้าแรก',
    contentSection: 'เนื้อหาที่แสดง',
    uploadCTA: 'แก้ไขข้อมูล',
    lastUpdated: 'อัปเดตล่าสุด',
  },
  EN: {
    dashboard: 'Dashboard',
    tabs: ['DashBoard', 'User Management', 'Problem Tag Management', 'Homepage Management', 'PDPA Management'],
    searchPlaceholder: 'Search...',
    logout: 'Logout',
    export: 'Export',
    pageTitle: 'Homepage Management',
    heroSection: 'Hero Banner',
    statsSection: 'Homepage Highlights',
    contentSection: 'Displayed Content Blocks',
    uploadCTA: 'Edit content',
    lastUpdated: 'Last updated',
  },
  JP: {
    dashboard: 'ダッシュボード',
    tabs: ['ダッシュボード', 'ユーザー管理', '問題タグ管理', 'ホームページ管理', 'PDPA管理'],
    searchPlaceholder: '検索...',
    logout: 'ログアウト',
    export: 'Export',
    pageTitle: 'ホームページ管理',
    heroSection: 'ヒーローバナー',
    statsSection: 'ホームページのハイライト',
    contentSection: '表示されるコンテンツ',
    uploadCTA: 'コンテンツを編集',
    lastUpdated: '最終更新',
  },
};

export default function HomepageManagementPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('homepageManagement');
  const languageDropdownRef = useRef(null);

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

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

  const handleTabClick = (targetTab) => {
    setActiveTab(targetTab);
    if (targetTab === 'dashboard') {
      router.push('/admin-dashboard');
    } else if (targetTab === 'userManagement') {
      router.push('/admin-dashboard/user-management');
    } else if (targetTab === 'problemTagManagement') {
      router.push('/admin-dashboard/problem-tag-management');
    } else if (targetTab === 'homepageManagement') {
      router.push('/admin-dashboard/homepage-management');
    } else if (targetTab === 'pdpaManagement') {
      router.push('/admin-dashboard/pdpa-management');
    }
  };

  return (
    <div className={`min-h-screen bg-[#f5f5f5] flex ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-[1440px] mx-auto flex relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[250px] bg-white border-r border-gray-200 flex-col transform transition-transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } md:flex`}
        >
          <div className="px-4 py-4 items-center justify-center flex">
            <Image src="/logo.svg" alt="alt design office" width={110} height={60} priority />
          </div>

          <nav className="flex-1 px-4 py-4">
            <div className="flex flex-col gap-2">
              {t.tabs.map((tab, idx) => {
                const tabKeys = [
                  'dashboard',
                  'userManagement',
                  'problemTagManagement',
                  'homepageManagement',
                  'pdpaManagement',
                ];
                const targetTab = tabKeys[idx] || 'dashboard';

                const getIcon = (index) => {
                  if (index === 0) return <Image src="/dashboard.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  if (index === 1) return <Image src="/user.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  if (index === 2) return <Image src="/file.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  if (index === 3) return <Image src="/home.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  if (index === 4) return <Image src="/verify.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  return null;
                };

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabClick(targetTab)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === targetTab
                        ? 'bg-gray-100 text-gray-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {getIcon(idx)}
                    {tab}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 whitespace-nowrap">
              {t.pageTitle}
            </h1>
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

          <main className="flex-1 overflow-auto p-4 md:p-6 bg-[#f5f5f5]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t.heroSection}</h2>
                    <p className="text-sm text-gray-500">{t.lastUpdated}: 12 Nov 2025</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800">
                    {t.uploadCTA}
                  </button>
                </div>
                <div className="h-40 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  Hero preview / slider placeholder
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t.statsSection}</h2>
                    <p className="text-sm text-gray-500">{t.lastUpdated}: 10 Nov 2025</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800">
                    {t.uploadCTA}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {['Visitors', 'Exhibitors', 'Sessions', 'Partners'].map((label) => (
                    <div key={label} className="rounded-xl border border-gray-100 p-4">
                      <p className="text-xs uppercase text-gray-500">{label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {Math.floor(Math.random() * 9000) + 1000}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.contentSection}</h2>
                  <p className="text-sm text-gray-500">
                    {t.lastUpdated}: 8 Nov 2025
                  </p>
                </div>
                <button className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800">
                  {t.uploadCTA}
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((block) => (
                  <div key={`block-${block}`} className="border border-gray-100 rounded-xl p-4">
                    <div className="h-32 rounded-lg bg-gray-50 border border-dashed border-gray-200 mb-4 flex items-center justify-center text-gray-400 text-xs">
                      Image / Block {block}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Section {block}</p>
                    <p className="text-xs text-gray-500">
                      Placeholder description for homepage content block {block}.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

