'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localFont from 'next/font/local';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MainNavbar from '../components/MainNavbar';

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

const defaultTranslations = {
  TH: {
    heading: 'ยินดีต้อนรับสู่ alt design office',
    description:
      'ส่งเสริมประสบการณ์นิทรรศการผ่านการจับคู่ที่ใช่ สำรวจงานและผู้จัดได้จากที่นี่',
    exploreButton: 'สำรวจงานนิทรรศการ',
    loginCta: 'เข้าสู่ระบบ',
  },
  JP: {
    heading: 'alt design office へようこそ',
    description:
      '最適なマッチングで展示体験を向上しましょう。注目イベントをここからチェック。',
    exploreButton: '展示を探す',
    loginCta: 'ログイン',
  },
};

export default function HomePage() {
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [translations, setTranslations] = useState(defaultTranslations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
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
          if (data.content) {
            // Merge with default translations to ensure all fields exist
            setTranslations({
              TH: {
                ...defaultTranslations.TH,
                ...(data.content.TH || {}),
              },
              JP: {
                ...defaultTranslations.JP,
                ...(data.content.JP || {}),
              },
            });
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

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  // Keep brand name on one line
  const brandMatch = t.heading.match(/alt design office/i);
  const headingContent =
    brandMatch && brandMatch[0]
      ? (() => {
          const [before, after] = t.heading.split(brandMatch[0]);
          return (
            <>
              {before}
              <span className="whitespace-nowrap">{brandMatch[0]}</span>
              {after}
            </>
          );
        })()
      : t.heading;

  // Force line break before the specific phrase on the homepage
  const specialPhrase = 'สำหรับอุตสาหกรรมการผลิต ปี 2025';
  const descriptionContent =
    t.description && t.description.includes(specialPhrase)
      ? (() => {
          const [before, after] = t.description.split(specialPhrase);
          return (
            <>
              {before}
              <br />
              {specialPhrase}
              {after}
            </>
          );
        })()
      : t.description;

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-full h-[844px] md:h-screen bg-white flex flex-col relative">
        {/* Navbar */}
        <MainNavbar
          languageOptions={languageOptions}
          selectedLanguage={selectedLanguage}
          onLanguageSelect={handleLanguageSelect}
          loginLabel={t.loginCta}
        />

        {/* Hero Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-12 text-center gap-4 md:gap-6 pt-[80px] md:pt-0">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-snug md:leading-tight mb-4 md:mb-6">
              {headingContent}
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto">
              {descriptionContent}
            </p>
            <Link
              href="/user-panel"
              className="mt-2 bg-gray-900 text-white px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 rounded-xl text-sm md:text-base lg:text-lg font-semibold hover:bg-gray-800 transition inline-block"
            >
              {t.exploreButton}
            </Link>
          </div>
        </main>

        {/* Bottom spacer same as navbar */}
        <div className="w-full h-[64px] md:h-[80px] px-4 md:px-8 lg:px-12" />
      </div>
    </div>
  );
}

