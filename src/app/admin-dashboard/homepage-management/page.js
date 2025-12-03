'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    tabs: ['DashBoard', 'User Management', 'Problem Tag Management', 'Homepage Management'],
    searchPlaceholder: 'Search...',
    logout: 'ออกจากระบบ',
    export: 'Export',
    pageTitle: 'Homepage Management',
    heroSection: 'ส่วน Hero Banner',
    headingLabel: 'หัวข้อหลัก',
    descriptionLabel: 'คำอธิบาย',
    exploreButtonLabel: 'ข้อความปุ่มสำรวจงาน',
    loginCtaLabel: 'ข้อความปุ่มเข้าสู่ระบบ',
    editButton: 'แก้ไข',
    saveButton: 'บันทึก',
    cancelButton: 'ยกเลิก',
    saving: 'กำลังบันทึก...',
    saveSuccess: 'บันทึกสำเร็จ',
    saveError: 'เกิดข้อผิดพลาด',
    loading: 'กำลังโหลด...',
    lastUpdated: 'อัปเดตล่าสุด',
  },
  JP: {
    dashboard: 'ダッシュボード',
    tabs: ['ダッシュボード', 'ユーザー管理', '問題タグ管理', 'ホームページ管理'],
    searchPlaceholder: '検索...',
    logout: 'ログアウト',
    export: 'Export',
    pageTitle: 'ホームページ管理',
    heroSection: 'ヒーローバナー',
    headingLabel: '見出し',
    descriptionLabel: '説明',
    exploreButtonLabel: '探索ボタンのテキスト',
    loginCtaLabel: 'ログインボタンのテキスト',
    editButton: '編集',
    saveButton: '保存',
    cancelButton: 'キャンセル',
    saving: '保存中...',
    saveSuccess: '保存しました',
    saveError: 'エラーが発生しました',
    loading: '読み込み中...',
    lastUpdated: '最終更新',
  },
};

export default function HomepageManagementPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('homepageManagement');
  const languageDropdownRef = useRef(null);

  // Homepage content state
  const [homepageContent, setHomepageContent] = useState({
    TH: {
      heading: 'ยินดีต้อนรับสู่ alt design office',
      description: 'ส่งเสริมประสบการณ์นิทรรศการผ่านการจับคู่ที่ใช่ สำรวจงานและผู้จัดได้จากที่นี่',
      exploreButton: 'สำรวจงานนิทรรศการ',
      loginCta: 'เข้าสู่ระบบ',
    },
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [lastUpdated, setLastUpdated] = useState(null);

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

  // Load homepage content from Firebase
  useEffect(() => {
    const loadHomepageContent = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'homepageContent', 'main');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const content = data.content || homepageContent;
          // Ensure TH exists with all fields
          setHomepageContent({
            TH: {
              ...homepageContent.TH,
              ...(content.TH || {}),
            },
          });
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt));
          }
        }
      } catch (error) {
        console.error('Error loading homepage content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomepageContent();
  }, []);

  const handleInputChange = (lang, field, value) => {
    setHomepageContent((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage({ type: '', text: '' });
      
      const docRef = doc(db, 'homepageContent', 'main');
      await setDoc(docRef, {
        content: homepageContent,
        updatedAt: new Date(),
      }, { merge: true });
      
      setLastUpdated(new Date());
      setSaveMessage({ type: 'success', text: t.saveSuccess });
      setIsEditing(false);
      
      setTimeout(() => {
        setSaveMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving homepage content:', error);
      setSaveMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage({ type: '', text: '' });
    // Reload from Firebase
    const loadHomepageContent = async () => {
      try {
        const docRef = doc(db, 'homepageContent', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const content = data.content || homepageContent;
          // Ensure TH exists with all fields
          setHomepageContent({
            TH: {
              ...homepageContent.TH,
              ...(content.TH || {}),
            },
          });
        }
      } catch (error) {
        console.error('Error loading homepage content:', error);
      }
    };
    loadHomepageContent();
  };

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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.heroSection}</h2>
                  {lastUpdated && (
                    <p className="text-sm text-gray-500">
                      {t.lastUpdated}: {lastUpdated.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        {t.cancelButton}
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving && (
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {isSaving ? t.saving : t.saveButton}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
                    >
                      {t.editButton}
                    </button>
                  )}
                </div>
              </div>

              {saveMessage.text && (
                <div
                  className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                    saveMessage.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">{t.loading}</div>
              ) : (
                <div className="space-y-6">
                  {/* Thai Content */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.headingLabel}
                        </label>
                        <input
                          type="text"
                          value={homepageContent.TH.heading}
                          onChange={(e) => handleInputChange('TH', 'heading', e.target.value)}
                          disabled={!isEditing}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.descriptionLabel}
                        </label>
                        <textarea
                          value={homepageContent.TH.description}
                          onChange={(e) => handleInputChange('TH', 'description', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.exploreButtonLabel}
                        </label>
                        <input
                          type="text"
                          value={homepageContent.TH.exploreButton}
                          onChange={(e) => handleInputChange('TH', 'exploreButton', e.target.value)}
                          disabled={!isEditing}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.loginCtaLabel}
                        </label>
                        <input
                          type="text"
                          value={homepageContent.TH.loginCta || ''}
                          onChange={(e) => handleInputChange('TH', 'loginCta', e.target.value)}
                          disabled={!isEditing}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

