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
import { useLanguage } from '../contexts/LanguageProvider';


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
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { isAccepted, toggleConsent } = useConsent();
  const { language, toggleLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language])

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
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryOpen(false);
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
    setIsCategoryOpen(false);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInterests', JSON.stringify(e.selectedCategories));
    }
    const formData = new FormData(e.currentTarget);
    // 2. ส่งค่า isActionCared ไปให้ Server Action เป็นพารามิเตอร์ที่ 2
    const result = await sentForm(formData, isAccepted);
    if (result) {
      router.replace('/usermatching');
    } else {
      setIsSubmitting(false)
    }
  };


  return (
    <div className={`relative z-0 min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 md:p-6 `}>
      <div className="w-full max-w-[390px] lg:max-w-xl sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">
        {/* Header with Logo and Language Selector */}
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

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                  {t.position}
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleTextInput}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.positionPlaceholder}
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
                    const placeholder =
                      tagsLoading && problemTags.length === 0 ? 'Loading...' : t.selectCategory;
                    return (
                      <div key={index} className="flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCategoryOpen((prev) => !prev)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-left text-sm sm:text-base bg-white flex items-center justify-between"
                        >
                          <span className={`${selectedCategory ? 'text-gray-900' : 'text-gray-400'}`}>
                            {selectedCategory
                              ? getTagLabelByLanguage(selectedCategory, selectedLanguage.code)
                              : placeholder}
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
                          >
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isCategoryOpen && (
                          <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                            <button
                              type="button"
                              onClick={() => handleCategoryChange(index, '')}
                              className="w-full text-left px-3 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-50"
                            >
                              {placeholder}
                            </button>
                            {problemTags.map((tag) => (
                              <button
                                key={`${tag.name}-${index}`}
                                type="button"
                                onClick={() => handleCategoryChange(index, tag.name)}
                                className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-gray-50 ${selectedCategory === tag.name ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  }`}
                              >
                                {getTagLabelByLanguage(tag.name, selectedLanguage.code)}
                              </button>
                            ))}
                          </div>
                        )}
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
                disabled={isSubmitting}
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
