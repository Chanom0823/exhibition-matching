'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageProvider';
import translations from '../components/translations';

export default function HomePage() {
  
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const {language, toggleLanguage} = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];

  useEffect(()=>{
    setSelectedLanguage(language);
  }, [language])

  // Keep brand name on one line
  const brandMatch = t.headingHome.match();
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

  // // Force line break before the specific phrase on the homepage
  const specialPhrase = 'สำหรับอุตสาหกรรมการผลิต ปี 2025';
  const descriptionContent =
    t.descriptionHome && t.descriptionHome.includes(specialPhrase)
      ? (() => {
          const [before, after] = t.descriptionHome.split(specialPhrase);
          return (
            <>
              {before}
              <br />
              {specialPhrase}
              {after}
            </>
          );
        })()
      : t.descriptionHome;  

  return (
    <>
        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-12 text-center gap-4 md:gap-6 pt-20 md:pt-0">
          <div className="max-w-3xl  mx-auto">
            <h1 className="text-xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-snug md:leading-tight mb-4 md:mb-6">
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
        </div>

        {/* Bottom spacer same as navbar */}
        <div className="w-full h-16 md:h-20 px-4 md:px-8 lg:px-12" />
    </>
  );
}

