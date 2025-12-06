'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import localFont from 'next/font/local';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import translations, { japaneseTagLabels } from '../components/translations';
import { sentForm } from './action';
import UserPanelPDPA from '../components/ีuser-panels/UserPanelPDPA';
import { useConsent } from '../contexts/pdpa';

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


const getTagLabelByLanguage = (name, languageCode) => {
  if (languageCode === 'JP') {
    return japaneseTagLabels[name] || name;
  }
  return name;
};

export default function UserPanelPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const { isAccepted, toggleConsent } = useConsent();

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    contact: '',
    categories: ['', ''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const fallbackProblemTags = [
    { name: 'Smart Farming', description: '' },
    { name: 'Green Energy', description: '' },
    { name: 'Healthcare', description: '' },
    { name: 'Supply Chain', description: '' },
    { name: 'Smart City', description: '' },
  ];
  const [problemTags, setProblemTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);

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

  useEffect(() => {
    const fetchProblemTags = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'problemTags'));
        const tagsMap = new Map();
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const name = data.name?.trim();
          if (name) {
            tagsMap.set(name, {
              name: name,
              description: data.description?.trim() || '',
            });
          }
        });
        const uniqueTags = Array.from(tagsMap.values());
        setProblemTags(uniqueTags.length > 0 ? uniqueTags : fallbackProblemTags);
      } catch (error) {
        console.error('Error fetching problem tags:', error);
        setProblemTags(fallbackProblemTags);
      } finally {
        setTagsLoading(false);
      }
    };
    fetchProblemTags();
  }, []);

  // useEffect(() => {
  //   const checkPDPAStatus = () => {
  //     const accepted =
  //       typeof window !== 'undefined' ? localStorage.getItem('pdpaAccepted') === 'true' : false;
  //     setHasAcceptedPDPA(accepted);
  //     if (accepted) {
  //       setPdpaAgreed(true);
  //     }
  //   };

  //   checkPDPAStatus();
  //   window.addEventListener('focus', checkPDPAStatus);
  //   return () => {
  //     window.removeEventListener('focus', checkPDPAStatus);
  //   };
  // }, []);

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTextInput = (e) => {
    const value = e.target.value;
    // Allow only letters (including Thai, English, Japanese characters) and spaces
    const lettersOnly = value.replace(/[^a-zA-Zก-๙ぁ-んァ-ヶー一-龯\s]/g, '');
    setFormData({
      ...formData,
      [e.target.name]: lettersOnly,
    });
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...formData.categories];
    newCategories[index] = value;
    setFormData({
      ...formData,
      categories: newCategories,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInterests', JSON.stringify(e.selectedCategories));
    }
    const formData = new FormData(e.currentTarget);
    // 2. ส่งค่า isActionCared ไปให้ Server Action เป็นพารามิเตอร์ที่ 2
    await sentForm(formData, isAccepted);
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  return (
    <div className={`relative z-0 min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 md:p-6 ${currentFontClass}`}>
      <div className="w-full max-w-[390px] sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">
        {/* Header with Logo and Language Selector */}
        <div className="w-full max-w-[2270.4px] md:max-w-7xl mx-auto h-[64px] md:h-[80px] flex justify-between items-center px-4 md:px-8 lg:px-12 py-[10px] flex-shrink-0">
          {/* Logo - Top Left */}
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
              className="w-[80px] h-[39px] md:w-[100px] md:h-[49px]"
              priority
            />
          </button>
          {/* Language Selector - Top Right */}
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
                      className={`w-full text-left px-4 py-2 md:py-2.5 text-sm md:text-base flex items-center justify-between ${selectedLanguage.code === option.code
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 sm:gap-4">
            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{t.title}</h1>
              <p className="text-xs sm:text-sm text-gray-600 px-2">{t.instruction}</p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                  {t.fullName}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleTextInput}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.fullNamePlaceholder}
                  required
                />
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                  {t.companyName}
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleTextInput}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.companyNamePlaceholder}
                  required
                />
              </div>

              {/* Contact Info */}
              <div>
                <label htmlFor="contact" className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                  {t.contactInfo}
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="text"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.contactPlaceholder}
                />
              </div>

              {/* Problem Categories */}
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                  {t.problemCategory}
                </label>
                <div className="flex flex-col gap-2">
                  {[0].map((index) => {
                    const selectedCategory = formData.categories[index];
                    const selectedTag = problemTags.find((tag) => tag.name === selectedCategory);
                    return (
                      <div key={index} className="flex flex-col gap-1.5">
                        <select
                          value={selectedCategory}
                          name="selectedCategories"
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base appearance-none bg-white"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem',
                          }}
                        >
                          <option value="">
                            {tagsLoading && problemTags.length === 0 ? 'Loading...' : t.selectCategory}
                          </option>
                          {problemTags.map((tag) => (
                            <option key={`${tag.name}-${index}`}  value={tag.name}>
                              {getTagLabelByLanguage(tag.name, selectedLanguage.code)}
                            </option>
                          ))}
                        </select>
                        {selectedTag && selectedTag.description && (
                          <p className="text-xs sm:text-sm text-gray-600 px-3 sm:px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            {selectedTag.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <UserPanelPDPA pdpa={t.pdpa} readPolicy={t.readPolicy} back={t.back} selectedLanguage={selectedLanguage} />

              {/* Submit Button */}
              <button
                type="submit"
                // disabled={isSubmitting || !pdpaAgreed}
                className="w-full bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base mt-3 sm:mt-4 hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : t.register}
              </button>
              {submitMessage && (
                <p
                  className={`text-xs sm:text-sm mt-2 ${submitMessage === t.submitSuccess ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                  {submitMessage}
                </p>
              )}
            </div>
          </form>
        </main>
      </div>

    </div>
  );
}
