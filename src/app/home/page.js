'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localFont from 'next/font/local';

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
    heading: 'ยินดีต้อนรับสู่ alt design office',
    description:
      'ส่งเสริมประสบการณ์นิทรรศการผ่านการจับคู่ที่ใช่ สำรวจงานและผู้จัดได้จากที่นี่',
    exploreButton: 'สำรวจงานนิทรรศการ',
    loginCta: 'เข้าสู่ระบบ',
  },
  EN: {
    heading: 'Welcome to alt design office',
    description:
      'Enhance exhibition experiences with the perfect match. Discover featured events here.',
    exploreButton: 'Explore Exhibitions',
    loginCta: 'Login',
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
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);

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

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-full h-[844px] md:h-screen bg-white flex flex-col relative">
        {/* Navbar */}
        <div className="w-full max-w-[390px] md:max-w-7xl mx-auto h-[64px] md:h-[80px] flex justify-between items-center px-4 md:px-8 lg:px-12 py-[10px]">
          <div className="flex items-center">
            <Image
              src="/logo.svg"
              alt="alt design office"
              width={80}
              height={39}
              className="w-[80px] h-[39px] md:w-[100px] md:h-[49px]"
              priority
            />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={languageDropdownRef}>
              <button
                type="button"
                className="bg-gray-800 text-white rounded-lg w-[68px] h-[35px] md:w-[80px] md:h-[40px] text-sm md:text-base flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
                onClick={() => setIsLanguageOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isLanguageOpen}
              >
                {selectedLanguage.code}{' '}
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
              {isLanguageOpen && (
                <ul
                  className="absolute right-0 mt-2 w-32 md:w-36 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
                  role="listbox"
                  aria-label="เลือกภาษา"
                >
                  {languageOptions.map((option) => (
                    <li key={option.code}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2 md:py-2.5 text-sm md:text-base flex items-center justify-between ${
                          selectedLanguage.code === option.code
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleLanguageSelect(option)}
                        role="option"
                        aria-selected={selectedLanguage.code === option.code}
                      >
                        <span>{option.label}</span>
                        <span className="font-semibold">{option.code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href="/login"
              className="bg-gray-800 text-white rounded-lg w-[68px] h-[35px] md:w-[80px] md:h-[40px] text-sm md:text-base flex items-center justify-center hover:bg-gray-700 transition"
            >
              {t.loginCta}
            </Link>
          </div>
        </div>

        {/* Hero Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-12 text-center gap-4 md:gap-6 pt-[80px] md:pt-0">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-snug md:leading-tight mb-4 md:mb-6">
              {headingContent}
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto">
              {t.description}
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

