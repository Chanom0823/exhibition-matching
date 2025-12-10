'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageProvider';
import translations from './translations';
import TranslationSelection from './TranslationSelection';

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

export default function MainNavbar({ languageOptions, onLanguageSelect, loginLabel }: MainNavbarProps) {
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);

  const pathName = usePathname();
  const [path, setPath] = useState(pathName);
  const { language, toggleLanguage } = useLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];
  
    useEffect(() => {
      setSelectedLanguage(language);
    }, [language])
  useEffect(() => {
    setPath(path);
  }, [pathName])
  // useEffect(() => {

  return (
    <div className="w-full max-w-[2270.4px] md:max-w-7xl mx-auto h-16 md:h-20 flex justify-between items-center px-4 md:px-8 lg:px-12 py-2.5">
      <Link href={'/'} className="flex items-center">
        <Image
          src="/logo.svg"
          alt="alt design office"
          width={80}
          height={39}
          className="w-20 h-[39px] md:w-[100px] md:h-[49px]"
          priority
        />
      </Link>

      <div className="flex items-center gap-2  md:gap-4">
        <div className='h-[35px]  md:h-10'>
          <TranslationSelection  />

        </div>
        {!['/usermatching', '/user-panel', '/login'].includes(pathName || '') && (
          <Link
            href="/login"
            className="bg-gray-800 text-white rounded-lg w-[70px] h-[35px] md:w-[100px] md:h-10 text-sm md:text-base flex items-center justify-center hover:bg-gray-700 transition"
          >
            {t.loginCta}
          </Link>
        )}
      </div>
    </div>
  );
}
