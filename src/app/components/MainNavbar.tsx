'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageProvider';
import translations from './translations';

type LanguageOption = {
  code: string;   // 'TH' | 'JP'
  label: string;  // ภาษาไทย / 日本語
};

type MainNavbarProps = {
  languageOptions: LanguageOption[];
  selectedLanguage: LanguageOption;
  onLanguageSelect: (option: LanguageOption) => void;
  loginLabel: string; // เช่น t.loginCta
};

export default function MainNavbar({
  languageOptions,
  selectedLanguage,
  onLanguageSelect,
  loginLabel,
}: MainNavbarProps) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  const {language, toggleLanguage} = useLanguage();
  
  const path = usePathname();
  const [pathName, setPathName] = useState(path);
  useEffect(()=>{
    setPathName(path);
  },[path ])
  
 const t = translations[selectedLanguage.code];
 console.log("check t " , t)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageClick = (option: LanguageOption) => {
    onLanguageSelect(option);
    toggleLanguage(option)
    setIsLanguageOpen(false);
  };

  return (
    <div className="w-full max-w-[2270.4px] md:max-w-7xl mx-auto h-16 md:h-20 flex justify-between items-center px-4 md:px-8 lg:px-12 py-2.5">
      <div className="flex items-center">
        <Image
          src="/logo.svg"
          alt="alt design office"
          width={80}
          height={39}
          className="w-20 h-[39px] md:w-[100px] md:h-[49px]"
          priority
        />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative" ref={languageDropdownRef}>
          <button
            type="button"
            className="bg-gray-800 text-white rounded-lg w-[68px] h-[35px] md:w-20 md:h-10 text-sm md:text-base flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
            onClick={() => setIsLanguageOpen(prev => !prev)}
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
              {languageOptions.map(option => (
                <li key={option.code}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 md:py-2.5 text-sm md:text-base flex items-center justify-between ${
                      selectedLanguage.code === option.code
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleLanguageClick(option)}
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
          className="bg-gray-800 text-white rounded-lg w-[68px] h-[35px] md:w-20 md:h-10 text-sm md:text-base flex items-center justify-center hover:bg-gray-700 transition"
        >
          {t.loginCta}
        </Link>
      </div>
    </div>
  );
}
