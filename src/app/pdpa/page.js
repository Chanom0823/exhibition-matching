'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
    title: 'นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    back: 'ย้อนกลับ',
    acceptLabel: 'ข้าพเจ้ายินยอมให้มีการจัดเก็บและประมวลผลข้อมูลส่วนบุคคลของฉัน ตามนโยบาย PDPA',
    acceptButton: 'ยอมรับ',
    content: `
      <h2 class="text-xl font-bold mb-4">นโยบายคุ้มครองข้อมูลส่วนบุคคล</h2>
      <p class="mb-4">บริษัท alt design office ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">1. การเก็บรวบรวมข้อมูล</h3>
      <p class="mb-4">เราจะเก็บรวบรวมข้อมูลส่วนบุคคลของท่านเท่าที่จำเป็นสำหรับการให้บริการ</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">2. การใช้ข้อมูล</h3>
      <p class="mb-4">ข้อมูลส่วนบุคคลของท่านจะถูกใช้เพื่อวัตถุประสงค์ในการให้บริการและปรับปรุงประสบการณ์การใช้งาน</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">3. การเปิดเผยข้อมูล</h3>
      <p class="mb-4">เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านให้กับบุคคลที่สามโดยไม่ได้รับความยินยอมจากท่าน</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">4. สิทธิของท่าน</h3>
      <p class="mb-4">ท่านมีสิทธิในการเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของท่านได้ตลอดเวลา</p>
    `,
  },
  EN: {
    title: 'Personal Data Protection Policy (PDPA)',
    back: 'Back',
    acceptLabel: 'I consent to the collection and processing of my personal data according to the PDPA policy.',
    acceptButton: 'Accept',
    content: `
      <h2 class="text-xl font-bold mb-4">Personal Data Protection Policy</h2>
      <p class="mb-4">alt design office values the protection of your personal data</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">1. Data Collection</h3>
      <p class="mb-4">We will collect your personal data only as necessary for providing our services</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">2. Data Usage</h3>
      <p class="mb-4">Your personal data will be used for service purposes and to improve user experience</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">3. Data Disclosure</h3>
      <p class="mb-4">We will not disclose your personal data to third parties without your consent</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">4. Your Rights</h3>
      <p class="mb-4">You have the right to access, modify, or delete your personal data at any time</p>
    `,
  },
  JP: {
    title: '個人情報保護方針（PDPA）',
    back: '戻る',
    acceptLabel: '私はPDPAポリシーに従って個人情報の収集・処理に同意します。',
    acceptButton: '同意する',
    content: `
      <h2 class="text-xl font-bold mb-4">個人情報保護方針</h2>
      <p class="mb-4">alt design officeは、お客様の個人情報の保護を重視しています</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">1. データの収集</h3>
      <p class="mb-4">サービス提供に必要な範囲でのみ個人データを収集します</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">2. データの使用</h3>
      <p class="mb-4">お客様の個人データは、サービス提供とユーザー体験の向上のために使用されます</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">3. データの開示</h3>
      <p class="mb-4">お客様の同意なく、第三者に個人データを開示することはありません</p>
      
      <h3 class="text-lg font-semibold mb-2 mt-6">4. お客様の権利</h3>
      <p class="mb-4">お客様は、いつでも個人データにアクセス、修正、削除する権利があります</p>
    `,
  },
};

export default function PDPAPage() {
  const router = useRouter();
  
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
    if (storedLanguage) {
      const foundOption = languageOptions.find((option) => option.code === storedLanguage);
      if (foundOption) {
        setSelectedLanguage(foundOption);
      }
    }

    // บันทึกว่าผู้ใช้ได้เข้าหน้า PDPA แล้ว
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasVisitedPDPA', 'true');
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

  const handleAccept = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('pdpaAccepted', 'true');
    }
    router.push('/user-panel');
  };

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center ${currentFontClass}`}>
      <div className="w-[390px] h-[844px] bg-white flex flex-col relative overflow-y-auto">
        {/* Navbar */}
        <div className="w-full h-[64px] flex justify-between items-center px-4 py-[10px] flex-shrink-0">
          <button
            type="button"
            className="flex items-center"
            onClick={() => router.push('/')}
            aria-label="กลับไปหน้าแรก"
          >
            <Image
              src="/logo.svg"
              alt="alt design office"
              width={80}
              height={39}
              className="w-[80px] h-[39px]"
              priority
            />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative" ref={languageDropdownRef}>
              <button
                type="button"
                className="bg-gray-800 text-white rounded-lg w-[68px] h-[35px] text-sm flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
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
                  className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
                  role="listbox"
                  aria-label="เลือกภาษา"
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
          </div>
        </div>

        {/* Back Button */}
        <div className="px-4 py-[10px]">
          <button
            type="button"
            onClick={() => router.push('/user-panel')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-medium">{t.back}</span>
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.title}</h1>
          <div 
            className="text-sm text-gray-700 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: t.content }}
          />

          <form onSubmit={handleAccept} className="mt-auto flex flex-col gap-4 pb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">
                {t.acceptLabel}
              </span>
            </label>
            <button
              type="submit"
              disabled={!isAccepted}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold text-sm hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.acceptButton}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

