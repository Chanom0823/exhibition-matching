'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import translations, { japaneseTagLabels } from '../components/translations';
import { sentForm } from './action';
import { useLanguage } from '../contexts/LanguageProvider';

import { useRouter } from 'next/navigation';

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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  const { language } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];


  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    contact: '',
    position: '',
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

  // init language from localStorage + click outside dropdowns
  useEffect(() => {
    const storedLanguage =
      typeof window !== 'undefined'
        ? localStorage.getItem('selectedLanguage')
        : null;

    if (storedLanguage) {
      const foundOption = languageOptions.find(
        (option) => option.code === storedLanguage
      );
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

  // fetch problem tags
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
              name,
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
    setSubmitMessage('');
    setIsSubmitting(true);

    // ✅ บังคับให้เลือก Problem Category อย่างน้อย 1 อัน
    const primaryCategory = formData.categories[0];
    if (!primaryCategory) {
      setSubmitMessage(t.categoryRequired || 'กรุณาเลือกหมวดหมู่ปัญหา');
      setIsSubmitting(false);
      return;
    }

    const formDataObj = new FormData(e.currentTarget);

    const result = await sentForm(formDataObj, true);

    if (result) {
      router.replace('/usermatching');
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-0 bg-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-[390px] lg:max-w-xl sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">
        <main className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 sm:gap-4">
            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                {t.title}
              </h1>
              <p className="text-xs sm:text-xl text-gray-900 font-medium px-2">
                {t.instruction}
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs sm:text-lg text-gray-700 mb-1.5 font-bold"
                >
                  {t.fullName}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName || ''}
                  onChange={handleTextInput}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.fullNamePlaceholder}
                  required
                />
              </div>

              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-xs sm:text-lg text-gray-700 mb-1.5 font-bold"
                >
                  {t.companyName}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName || ''}
                  onChange={handleTextInput}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.companyNamePlaceholder}
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label
                  htmlFor="position"
                  className="block text-xs sm:text-lg text-gray-700 mb-1.5 font-bold"
                >
                  {t.position}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position || ''}
                  onChange={handleTextInput}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.positionPlaceholder}
                  required
                />
              </div>

              {/* Contact Info */}
              <div>
                <label
                  htmlFor="contact"
                  className="block text-xs sm:text-lg text-gray-700 mb-1.5 font-bold"
                >
                  {t.contactInfo}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="text"
                  value={formData.contact || ''}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.contactPlaceholder}
                />
              </div>

              {/* Problem Categories */}
              <div>
                <label className="block text-xs sm:text-lg text-gray-700 mb-1.5 font-bold">
                  {t.problemCategory}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {[0].map((index) => {
                    const selectedCategory = formData.categories[index];
                    const selectedTag = problemTags.find(
                      (tag) => tag.name === selectedCategory
                    );
                    return (
                      <div key={index} className="flex flex-col gap-1.5">
                        <select
                          value={selectedCategory}
                          name="selectedCategories"
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          required
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
                            {tagsLoading && problemTags.length === 0
                              ? 'Loading...'
                              : t.selectCategory}
                          </option>
                          {problemTags.map((tag) => (
                            <option key={`${tag.name}-${index}`} value={tag.name}>
                              {getTagLabelByLanguage(tag.name, selectedLanguage.code)}
                            </option>
                          ))}
                        </select>

                        {selectedTag && selectedTag.description && (
                          <p className="text-[15px] sm:text-sm text-gray-900 px-3 sm:px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-bold">
                            {selectedTag.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PDPA Text */}
              <p className="text-[13px] sm:text-lg text-gray-900 leading-snug mt-1 font-bold">
                {t.pdpa}
              </p>

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
                  className={`text-xs sm:text-sm mt-2 ${submitMessage === t.submitSuccess
                      ? 'text-green-600'
                      : 'text-red-600'
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