'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import localFont from 'next/font/local';
import { addDoc, collection, serverTimestamp, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { lookSesstion } from '@/lib/auth';

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
    title: 'ผู้แสดงสินค้าที่ตรงกับความสนใจของคุณ',
    titleLine1: 'ผู้แสดงสินค้าที่ตรงกับ',
    titleLine2: 'ความสนใจของคุณ',
    description: 'ผู้แสดงสินค้าที่ตรงกับปัญหาของคุณมากที่สุด',
    storeName: 'ร้าน A',
    storeNameC: 'ร้านค้า C',
    productType: 'ประเภทสินค้า',
    category: 'หมวดหมู่ 1',
    contact: 'ติดต่อ',
    details: 'รายละเอียด',
    contactChannel: 'ช่องทางติดต่อ',
    noFavorites: 'ยังไม่มีรายการโปรด',
    close: 'ปิด',
    companyName: 'ชื่อบริษัท',
    companyDescription: 'รายละเอียด',
    categories: 'หมวดหมู่',
    email: 'อีเมล',
    phone: 'เบอร์โทรศัพท์',
    website: 'เว็บไซต์',
    address: 'ที่อยู่',
    all: 'ทั้งหมด',
    problem: 'ปัญหา',
    favorites: 'รายการโปรด',
    backHome: 'กลับสู่หน้าหลัก',
    contactSuccess: 'ได้ติดต่อบริษัทแล้ว กรุณารอการติดต่อกลับ',
  },
  JP: {
    title: '展示マッチングシステム',
    description: 'あなたの課題に最も適した出展者',
    storeName: '店舗A',
    storeNameC: '店舗C',
    productType: '商品タイプ',
    category: 'カテゴリ1',
    contact: '連絡先',
    details: '詳細',
    contactChannel: '連絡先',
    noFavorites: 'お気に入りはまだありません',
    close: '閉じる',
    companyName: '会社名',
    companyDescription: '詳細',
    categories: 'カテゴリ',
    email: 'メール',
    phone: '電話番号',
    website: 'ウェブサイト',
    address: '住所',
    all: 'すべて',
    problem: '問題',
    favorites: 'お気に入り',
    backHome: 'ホームへ戻る',
    contactSuccess: '会社に連絡しました。折り返しの連絡をお待ちください。',
  },
};

export default function UserMatchingPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInterests, setUserInterests] = useState([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [problemTags, setProblemTags] = useState([]);
  const [contactedExhibitors, setContactedExhibitors] = useState([]);

  const handleFilterClick = (filterKey) => {
    setSelectedFilter(filterKey);
    if (filterKey !== 'problem') {
      setSelectedCategory(null);
    }
  };

  const handleCategorySelect = (tag) => {
    setSelectedFilter('problem');
    setSelectedCategory((prev) => (prev === tag ? null : tag));
  };
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  // Load user interests from localStorage or Firebase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get user interests from localStorage
      const storedInterests = localStorage.getItem('userInterests');
      if (storedInterests) {
        try {
          setUserInterests(JSON.parse(storedInterests));
        } catch (e) {
          console.error('Error parsing user interests:', e);
        }
      }
    }
  }, []);

  // Load exhibitors from Firebase
  useEffect(() => {
    const loadExhibitors = async () => {
      setLoading(true);
      try {
        const exhibitorsRef = collection(db, 'exhibitors');
        const querySnapshot = await getDocs(exhibitorsRef);
        
        const exhibitorsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Only include exhibitors that have been saved (have companyName and isComplete flag)
          if (data.isComplete && data.companyName && data.categories && data.categories.length > 0) {
            exhibitorsData.push({
              id: doc.id,
              ...data,
            });
          }
        });

        // Filter exhibitors by matching tags with user interests
        let filteredExhibitors = exhibitorsData;
        if (userInterests.length > 0) {
          filteredExhibitors = exhibitorsData.filter((exhibitor) => {
            if (!exhibitor.categories || exhibitor.categories.length === 0) return false;
            // Check if any exhibitor category matches any user interest
            return exhibitor.categories.some((category) =>
              userInterests.some((interest) =>
                category.toLowerCase().includes(interest.toLowerCase()) ||
                interest.toLowerCase().includes(category.toLowerCase())
              )
            );
          });
        }

        setExhibitors(filteredExhibitors);
      } catch (error) {
        console.error('Error loading exhibitors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExhibitors();
  }, [userInterests]);

  useEffect(() => {
    const loadProblemTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, 'problemTags'));
        const tags = tagsSnapshot.docs
          .map((docSnap) => docSnap.data()?.name?.trim())
          .filter((name, index, self) => name && self.indexOf(name) === index);
        setProblemTags(tags);
      } catch (error) {
        console.error('Error loading problem tags:', error);
      }
    };

    loadProblemTags();
  }, []);

  // Carousel should always use the full exhibitors list
  const carouselExhibitors = exhibitors;

  // Filter exhibitors based on selected filters
  let filteredExhibitors = exhibitors;

  if (selectedFilter === 'contacted') {
    filteredExhibitors = filteredExhibitors.filter((exhibitor) =>
      contactedExhibitors.includes(exhibitor.id)
    );
  } else if (selectedCategory) {
    const normalizedCategory = selectedCategory.toLowerCase();
    filteredExhibitors = filteredExhibitors.filter(
      (exhibitor) =>
        exhibitor.categories &&
        exhibitor.categories.some(
          (category) => category && category.toLowerCase() === normalizedCategory
        )
    );
  }

  useEffect(() => {
    const storedLanguage =
      typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
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

  // Load contacted exhibitors from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('contactedExhibitors');
      if (stored) {
        try {
          setContactedExhibitors(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing contactedExhibitors:', e);
        }
      }
    }
  }, []);

  // Persist contacted exhibitors to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contactedExhibitors', JSON.stringify(contactedExhibitors));
    }
  }, [contactedExhibitors]);

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

  const titleContent = t.titleLine2 ? (
    <>
      {t.titleLine1}
      <br />
      {t.titleLine2}
    </>
  ) : (
    t.title
  );

  return (
    <div
      className={`min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 md:p-6 ${currentFontClass}`}
    >
      <div className="w-full max-w-[390px] sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">
        {/* Navbar */}
        <div className="w-full max-w-[2270.4px] md:max-w-7xl mx-auto h-[64px] md:h-[80px] flex justify-between items-center px-4 md:px-8 lg:px-12 py-[10px] flex-shrink-0">
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
        </div>

        {/* Content */}
        <main className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-y-auto">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-2">{titleContent}</h1>
            <p className="text-sm text-gray-600">{t.description}</p>
          </div>

          {/* Map Image */}
          <div className="mb-4">
            <Image
              src="/Map.jpg"
              alt="Map"
              width={358}
              height={200}
              className="w-full rounded-lg"
            />
          </div>

          {/* Filter Buttons */}
          <div className="mb-4">
            <div className="flex justify-start gap-4 items-center">
              <button
                type="button"
                onClick={() => handleFilterClick('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-transparent text-gray-900 hover:text-gray-700'
                }`}
                aria-label="All"
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => handleFilterClick('contacted')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedFilter === 'contacted'
                    ? 'bg-gray-800 text-white'
                    : 'bg-transparent text-gray-900 hover:text-gray-700'
                }`}
                aria-label="Contacted"
              >
                ติดต่อแล้ว
              </button>
            </div>
          </div>

          {/* Horizontal Store Cards */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {selectedLanguage.code === 'TH' ? 'กำลังโหลด...' : selectedLanguage.code === 'EN' ? 'Loading...' : '読み込み中...'}
            </div>
          ) : filteredExhibitors.length > 0 ? (
            filteredExhibitors.map((exhibitor) => (
              <div
                key={exhibitor.id}
                className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-3 w-[358px] h-[100px] cursor-pointer transition hover:shadow-lg"
                onClick={() => {
                  setSelectedExhibitor(exhibitor);
                  setIsModalOpen(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedExhibitor(exhibitor);
                    setIsModalOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Circular Image */}
                  <div className="w-[60px] h-[60px] rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                    {exhibitor.logoUrl ? (
                      <Image
                        src={exhibitor.logoUrl}
                        alt={exhibitor.companyName || t.storeNameC}
                        width={60}
                        height={60}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Store Info and Actions */}
                  <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                    <div>
                      {/* Store Name */}
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`${promptFont.className} text-[16px] font-bold text-gray-900 mb-1 flex-1`}
                        >
                          {exhibitor.companyName || t.storeNameC}
                        </h3>
                        {contactedExhibitors.includes(exhibitor.id) && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full whitespace-nowrap">ติดต่อแล้ว</span>
                        )}
                      </div>

                      {/* Product Type */}
                      {exhibitor.companyDescription && (
                        <p
                          className={`${promptFont.className} text-[11px] font-medium text-gray-700 mb-2 line-clamp-1`}
                        >
                          {exhibitor.companyDescription.substring(0, 40)}...
                        </p>
                      )}

                      {/* Category Buttons */}
                      {exhibitor.categories && exhibitor.categories.length > 0 && (
                        <div className="flex gap-1.5 mb-2">
                          {exhibitor.categories.slice(0, 2).map((category, catIndex) => (
                            <span
                              key={catIndex}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-full flex items-center justify-center border border-gray-300 min-w-[100px] max-w-[160px] truncate"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))
          ) : (
            <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500 mb-4">
              {selectedLanguage.code === 'TH' 
                ? 'ไม่พบผู้แสดงสินค้า' 
                : selectedLanguage.code === 'EN' 
                ? 'No exhibitors found' 
                : '出展者が見つかりません'}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === pageNumber
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-label={`Go to page ${pageNumber}`}
              >
                {pageNumber}
              </button>
            ))}
          </div>

          {/* Back Home Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
            >
              {t.backHome}
            </button>
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedExhibitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] max-w-[400px] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-center items-center relative">
              <h2 className="text-lg font-bold text-gray-900">{t.details}</h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedExhibitor(null);
                }}
                className="absolute right-4 text-gray-500 hover:text-gray-700 transition"
                aria-label={t.close}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-gray-200">
                  {selectedExhibitor.logoUrl ? (
                    <Image
                      src={selectedExhibitor.logoUrl}
                      alt={selectedExhibitor.companyName || t.storeName}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.companyName}</label>
                <p className="text-base text-gray-900">{selectedExhibitor.companyName || '-'}</p>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.contactChannel}</label>
                
                {(selectedExhibitor.companyEmail || selectedExhibitor.email) && (
                  <div>
                    <span className="text-xs text-gray-500">{t.email}:</span>
                    <p className="text-base text-gray-900">{selectedExhibitor.companyEmail || selectedExhibitor.email}</p>
                  </div>
                )}

                {(selectedExhibitor.companyPhone || selectedExhibitor.phone) && (
                  <div>
                    <span className="text-xs text-gray-500">{t.phone}:</span>
                    <p className="text-base text-gray-900">{selectedExhibitor.companyPhone || selectedExhibitor.phone}</p>
                  </div>
                )}

                {(selectedExhibitor.companyWebsite || selectedExhibitor.website) && (
                  <div>
                    <span className="text-xs text-gray-500">{t.website}:</span>
                    <a
                      href={selectedExhibitor.companyWebsite || selectedExhibitor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedExhibitor.companyWebsite || selectedExhibitor.website}
                    </a>
                  </div>
                )}

                {selectedExhibitor.address && (
                  <div>
                    <span className="text-xs text-gray-500">{t.address}:</span>
                    <p className="text-base text-gray-900">{selectedExhibitor.address}</p>
                  </div>
                )}

                {!(selectedExhibitor.companyEmail || selectedExhibitor.email) && 
                 !(selectedExhibitor.companyPhone || selectedExhibitor.phone) && 
                 !(selectedExhibitor.companyWebsite || selectedExhibitor.website) && 
                 !selectedExhibitor.address && (
                  <p className="text-sm text-gray-500">-</p>
                )}
              </div>

              {/* Company Description */}
              {selectedExhibitor.companyDescription && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.companyDescription}</label>
                  <p className="text-base text-gray-900">{selectedExhibitor.companyDescription}</p>
                </div>
              )}

              {/* Categories */}
                    {selectedExhibitor.categories && selectedExhibitor.categories.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t.categories}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedExhibitor.categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-center items-center gap-3">
              {selectedExhibitor && contactedExhibitors.includes(selectedExhibitor.id) ? (
                <div className="px-6 py-2 text-sm font-semibold text-gray-700">ติดต่อแล้ว</div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const visiterId = await lookSesstion();
                    if (!visiterId) {
                      return;
                    }
                    try {
                      const washingtonRef = doc(db, 'userPanelSubmissions', visiterId);
                      await updateDoc(
                        washingtonRef,
                        {
                          exhibitorId: selectedExhibitor.id,
                          createdAt: serverTimestamp(),
                        },
                        { merge: true }
                      );

                      // Add to contacted list
                      setContactedExhibitors((prev) => [...new Set([...prev, selectedExhibitor.id])]);

                      setIsModalOpen(false);
                      setSelectedExhibitor(null);
                      setShowNotification(true);
                      setTimeout(() => {
                        setShowNotification(false);
                      }, 5000);
                    } catch (error) {
                      console.error('Error saving contact:', error);
                    }
                  }}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
                >
                  {t.contact}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 transition-all duration-300 ease-out">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-sm font-medium">{t.contactSuccess}</p>
        </div>
      )}
    </div>
  );
}

