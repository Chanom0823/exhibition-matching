'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import localFont from 'next/font/local';
import { addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
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
  EN: {
    title: 'Exhibition Matching',
    description: 'The exhibitors that best match your challenges',
    storeName: 'Store A',
    storeNameC: 'Store C',
    productType: 'Product Type',
    category: 'Category 1',
    contact: 'Contact',
    details: 'Details',
    contactChannel: 'Contact Channel',
    noFavorites: 'No favorites yet',
    close: 'Close',
    companyName: 'Company Name',
    companyDescription: 'Description',
    categories: 'Categories',
    email: 'Email',
    phone: 'Phone',
    website: 'Website',
    address: 'Address',
    all: 'All',
    problem: 'Problem',
    favorites: 'Favorites',
    backHome: 'Back to Home',
    contactSuccess: 'Contacted the company. Please wait for a callback.',
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
    { code: 'EN', label: 'English' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInterests, setUserInterests] = useState([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const toggleFavorite = (exhibitorId) => {
    setFavorites((prev) => ({
      ...prev,
      [exhibitorId]: !prev[exhibitorId],
    }));
  };

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

  // Carousel should always use the full exhibitors list
  const carouselExhibitors = exhibitors;

  // Filter exhibitors based on selected filter for list section
  const filteredExhibitors = selectedFilter === 'favorites'
    ? exhibitors.filter((exhibitor) => favorites[exhibitor.id])
    : exhibitors;

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

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  // Handle carousel scroll to update dots
  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const cardWidth = 180; // 180px card width
      const gap = 10; // 10px gap between cards
      const totalWidth = cardWidth + gap;
      const currentIndex = Math.round(scrollLeft / totalWidth);
      const clampedIndex = Math.max(0, Math.min(currentIndex, 2)); // Clamp between 0-2
      setCurrentSlide(clampedIndex);
    }
  };

  // Handle dot click to scroll to specific slide
  const handleDotClick = (index) => {
    if (carouselRef.current) {
      const cardWidth = 180; // 180px card width
      const gap = 10; // 10px gap between cards
      const totalWidth = cardWidth + gap;
      carouselRef.current.scrollTo({
        left: index * totalWidth,
        behavior: 'smooth',
      });
    }
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;
  const isSelectedFavorite =
    selectedExhibitor && favorites ? Boolean(favorites[selectedExhibitor.id]) : false;

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
    <div className={`min-h-screen bg-white flex items-center justify-center ${currentFontClass}`}>
      <div className="w-[390px] h-[844px] bg-white flex flex-col">
        {/* Navbar */}
        <div className="w-full h-[64px] flex justify-between items-center px-4 py-[10px]">
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

        {/* Content */}
        <main className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-2">{titleContent}</h1>
            <p className="text-sm text-gray-600">{t.description}</p>
          </div>

          {/* Store Cards Carousel */}
          {loading ? (
            <div className="mb-4 text-center py-8 text-gray-500">
              {selectedLanguage.code === 'TH' ? 'กำลังโหลด...' : selectedLanguage.code === 'EN' ? 'Loading...' : '読み込み中...'}
            </div>
          ) : carouselExhibitors.length > 0 ? (
            <div className="mb-4">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="carousel-container flex gap-[10px] overflow-x-auto snap-x snap-mandatory snap-start"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {carouselExhibitors.slice(0, 3).map((exhibitor, index) => (
                  <div key={exhibitor.id} className="w-[180px] h-[256px] bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center py-[10px] px-4 flex-shrink-0 snap-start">
                    {/* Circular Image */}
                    <div className="w-[80px] h-[80px] rounded-full overflow-hidden mb-2 flex-shrink-0 border border-gray-200">
                      {exhibitor.logoUrl ? (
                        <Image
                          src={exhibitor.logoUrl}
                          alt={exhibitor.companyName || t.storeName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Store Name */}
                    <h3
                      className={`${promptFont.className} text-[16px] font-bold text-gray-900 mb-1 text-center`}
                    >
                      {exhibitor.companyName || t.storeName}
                    </h3>

                    {/* Product Type */}
                    {exhibitor.companyDescription && (
                      <p
                        className={`${promptFont.className} text-[11px] font-medium text-gray-700 mb-2 text-center line-clamp-2`}
                      >
                        {exhibitor.companyDescription.substring(0, 30)}...
                      </p>
                    )}

                    {/* Category Buttons */}
                    <div className="flex flex-wrap gap-1.5 justify-center mb-2 flex-1 items-start">
                      {exhibitor.categories && exhibitor.categories.slice(0, 3).map((category, catIndex) => (
                        <span key={catIndex} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-full flex items-center justify-center max-w-[70px] truncate">
                          {category}
                        </span>
                      ))}
                    </div>

                    {/* Details Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExhibitor(exhibitor);
                        setIsModalOpen(true);
                      }}
                      className="w-[95px] h-[36px] bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition mt-auto"
                    >
                      {t.details}
                    </button>
                  </div>
                ))}
              </div>

              {/* Slide Dots */}
              {filteredExhibitors.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {[0, 1].slice(0, Math.min(2, Math.ceil(filteredExhibitors.length / 3))).map((index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDotClick(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-gray-800' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 text-center py-8 text-gray-500">
              {selectedLanguage.code === 'TH' 
                ? 'ไม่พบผู้แสดงสินค้าที่ตรงกับความสนใจของคุณ' 
                : selectedLanguage.code === 'EN' 
                ? 'No exhibitors match your interests' 
                : '興味に一致する出展者がありません'}
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex justify-start gap-4 mb-4 items-center">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-transparent text-gray-900 hover:text-gray-700'
              }`}
              aria-label={t.all}
            >
              {t.all}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('problem')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedFilter === 'problem'
                  ? 'bg-gray-800 text-white'
                  : 'bg-transparent text-gray-900 hover:text-gray-700'
              }`}
              aria-label={t.problem}
            >
              {t.problem}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('favorites')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
                selectedFilter === 'favorites'
                  ? 'bg-gray-800 text-white'
                  : 'bg-transparent text-gray-900 hover:text-gray-700'
              }`}
              aria-label={t.favorites}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={selectedFilter === 'favorites' ? 'white' : 'currentColor'}
                className="w-4 h-4"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {t.favorites}
            </button>
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
                      <h3
                        className={`${promptFont.className} text-[16px] font-bold text-gray-900 mb-1`}
                      >
                        {exhibitor.companyName || t.storeNameC}
                      </h3>

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
                            <span key={catIndex} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-full flex items-center justify-center border border-gray-300 flex-shrink-0 max-w-[70px] truncate">
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Favorite Star Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(exhibitor.id);
                    }}
                    className="flex-shrink-0 p-2 hover:opacity-70 transition-opacity"
                    aria-label={
                      favorites[exhibitor.id]
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={favorites[exhibitor.id] ? '#fbbf24' : 'none'}
                      stroke={favorites[exhibitor.id] ? '#fbbf24' : '#9ca3af'}
                      strokeWidth="2"
                      className="w-6 h-6"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500 mb-4">
              {selectedFilter === 'favorites' ? t.noFavorites : (selectedLanguage.code === 'TH' 
                ? 'ไม่พบผู้แสดงสินค้า' 
                : selectedLanguage.code === 'EN' 
                ? 'No exhibitors found' 
                : '出展者が見つかりません')}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.categories}</label>
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
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (selectedExhibitor) {
                    toggleFavorite(selectedExhibitor.id);
                  }
                }}
                className={`w-11 h-11 rounded-full border flex items-center justify-center transition ${
                  isSelectedFavorite
                    ? 'bg-yellow-400 border-yellow-400 text-white hover:bg-yellow-500'
                    : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'
                }`}
                aria-label={isSelectedFavorite ? t.favorites : t.favorites}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isSelectedFavorite ? 'currentColor' : 'none'}
                  stroke={isSelectedFavorite ? 'currentColor' : 'currentColor'}
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await addDoc(collection(db, 'contacts'), {
                      exhibitorId: selectedExhibitor.id,
                      companyName: selectedExhibitor.companyName,
                      createdAt: serverTimestamp(),
                    });
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

