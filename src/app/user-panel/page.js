'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import localFont from 'next/font/local';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    title: 'ยินดีต้อนรับ',
    instruction: 'กรอกข้อมูลที่จำเป็นเพื่อดำเนินการต่อ',
    fullName: 'ชื่อ-นามสกุล*',
    fullNamePlaceholder: 'ชื่อ-นามสกุล',
    companyName: 'ชื่อบริษัท*',
    companyNamePlaceholder: 'ชื่อบริษัท',
    contactInfo: 'อีเมล / เบอร์โทรศัพท์ (อย่างน้อย 1 ช่องทาง)',
    contactPlaceholder: 'อีเมล / เบอร์โทรศัพท์',
    problemCategory: 'หมวดปัญหา (เลือกได้สูงสุด 3 ข้อ)*',
    selectCategory: 'เลือกหมวดหมู่ปัญหา',
    pdpa: 'ข้าพเจ้ายินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    readPolicy: 'อ่านนโยบายได้ที่',
    register: 'ลงทะเบียน',
    pdpaRequired: 'กรุณายอมรับนโยบาย PDPA ก่อนส่งข้อมูล',
    categoryRequired: 'กรุณาเลือกหมวดหมู่ปัญหาอย่างน้อย 1 ข้อ',
    submitSuccess: 'ส่งข้อมูลสำเร็จแล้ว',
    submitError: 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่',
  },
  EN: {
    title: 'Welcome',
    instruction: 'Fill in the required information to continue',
    fullName: 'First-Last name*',
    fullNamePlaceholder: 'First-Last name',
    companyName: 'Company name*',
    companyNamePlaceholder: 'Company name',
    contactInfo: 'Email / Phone number (at least 1 channel)',
    contactPlaceholder: 'Email / Phone number',
    problemCategory: 'Problem category (select up to 3 items)*',
    selectCategory: 'Select problem category',
    pdpa: 'I agree to the Personal Data Protection Policy (PDPA)',
    readPolicy: 'Read policy at',
    register: 'Register',
    pdpaRequired: 'Please accept the PDPA policy before submitting',
    categoryRequired: 'Please select at least 1 problem category',
    submitSuccess: 'Information submitted successfully',
    submitError: 'Something went wrong while submitting. Please try again.',
  },
  JP: {
    title: 'ようこそ',
    instruction: '必要事項を入力して続行してください',
    fullName: '氏名*',
    fullNamePlaceholder: '氏名',
    companyName: '会社名*',
    companyNamePlaceholder: '会社名',
    contactInfo: 'メール / 電話番号 (少なくとも1つの連絡先)',
    contactPlaceholder: 'メール / 電話番号',
    problemCategory: '問題カテゴリ (最大3つまで選択)*',
    selectCategory: '問題カテゴリを選択',
    pdpa: '個人情報保護方針（PDPA）に同意します',
    readPolicy: 'ポリシーを読む',
    register: '登録',
    pdpaRequired: '送信する前にPDPAポリシーに同意してください',
    categoryRequired: '少なくとも1つの問題カテゴリを選択してください',
    submitSuccess: '情報が正常に送信されました',
    submitError: '送信中にエラーが発生しました。もう一度お試しください。',
  },
};

export default function UserPanelPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    contact: '',
    categories: ['', '', ''],
  });
  const [pdpaAgreed, setPdpaAgreed] = useState(false);
  const [hasAcceptedPDPA, setHasAcceptedPDPA] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const fallbackProblemTags = ['Smart Farming', 'Green Energy', 'Healthcare', 'Supply Chain', 'Smart City'];
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
        const names = snapshot.docs
          .map((docSnap) => docSnap.data().name)
          .filter((name) => typeof name === 'string' && name.trim() !== '');
        const uniqueNames = [...new Set(names.map((name) => name.trim()))];
        setProblemTags(uniqueNames.length > 0 ? uniqueNames : fallbackProblemTags);
      } catch (error) {
        console.error('Error fetching problem tags:', error);
        setProblemTags(fallbackProblemTags);
      } finally {
        setTagsLoading(false);
      }
    };
    fetchProblemTags();
  }, []);

  useEffect(() => {
    const checkPDPAStatus = () => {
      const accepted =
        typeof window !== 'undefined' ? localStorage.getItem('pdpaAccepted') === 'true' : false;
      setHasAcceptedPDPA(accepted);
      if (accepted) {
        setPdpaAgreed(true);
      }
    };

    checkPDPAStatus();
    window.addEventListener('focus', checkPDPAStatus);
    return () => {
      window.removeEventListener('focus', checkPDPAStatus);
    };
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pdpaAgreed) {
      setSubmitMessage(t.pdpaRequired);
      return;
    }

    const selectedCategories = formData.categories.filter((item) => item);
    if (selectedCategories.length === 0) {
      setSubmitMessage(t.categoryRequired);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await addDoc(collection(db, 'userPanelSubmissions'), {
        fullName: formData.fullName,
        companyName: formData.companyName,
        contact: formData.contact,
        categories: formData.categories.filter((item) => item),
        language: selectedLanguage.code,
        pdpaAccepted: true,
        createdAt: serverTimestamp(),
      });

      setSubmitMessage(t.submitSuccess);
      setFormData({
        fullName: '',
        companyName: '',
        contact: '',
        categories: ['', '', ''],
      });
      setPdpaAgreed(true);
      router.push('/usermatching');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage(t.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center ${currentFontClass}`}>
      <div className="w-[390px] h-[844px] bg-white flex flex-col relative overflow-y-auto">
        {/* Header with Logo and Language Selector */}
        <div className="w-full h-[64px] flex justify-between items-center px-4 py-[10px] flex-shrink-0">
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
              className="w-[80px] h-[39px]"
              priority
            />
          </button>
          {/* Language Selector - Top Right */}
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
              <p className="text-sm text-gray-600">{t.instruction}</p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm text-gray-700 mb-1.5 font-medium">
                  {t.fullName}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleTextInput}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-base"
                  placeholder={t.fullNamePlaceholder}
                  required
                />
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="block text-sm text-gray-700 mb-1.5 font-medium">
                  {t.companyName}
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleTextInput}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-base"
                  placeholder={t.companyNamePlaceholder}
                  required
                />
              </div>

              {/* Contact Info */}
              <div>
                <label htmlFor="contact" className="block text-sm text-gray-700 mb-1.5 font-medium">
                  {t.contactInfo}
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="text"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-base"
                  placeholder={t.contactPlaceholder}
                />
              </div>

              {/* Problem Categories */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 font-medium">
                  {t.problemCategory}
                </label>
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((index) => (
                    <select
                      key={index}
                      value={formData.categories[index]}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-base appearance-none bg-white"
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
                        <option key={`${tag}-${index}`} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>

              {/* PDPA Checkbox */}
              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={pdpaAgreed}
                    disabled={!hasAcceptedPDPA}
                    onChange={(e) => setPdpaAgreed(e.target.checked)}
                    className={`mt-1 w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 ${
                      hasAcceptedPDPA ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => router.push('/pdpa')}
                    className="text-sm text-gray-700 hover:text-gray-900 hover:underline text-left"
                  >
                    {t.pdpa}
                  </button>
                </div>
                <p className="text-xs text-gray-500 ml-6">{t.readPolicy}</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !pdpaAgreed}
                className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold text-base mt-4 hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : t.register}
              </button>
              {submitMessage && (
                <p
                  className={`text-sm mt-2 ${
                    submitMessage === t.submitSuccess ? 'text-green-600' : 'text-red-600'
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
