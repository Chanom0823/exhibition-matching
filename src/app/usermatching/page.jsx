'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageProvider';
import translations from '../components/translations';
import { loadProblemTag, queryMatching, } from './action';

// Decide readable text color based on background color
const getTextColorFromBg = (hex) => {
  if (!hex) return '#111827';
  let cleaned = hex.trim().replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((ch) => ch + ch).join('');
  }
  if (cleaned.length !== 6) return '#111827';

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#111827';

  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.6 ? '#111827' : '#ffffff';
};



export default function UserMatchingPage() {
  const router = useRouter();

  const languageDropdownRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInterests, setUserInterests] = useState([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [problemTags, setProblemTags] = useState([]);
  const { language, toggleLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];


  useEffect(() => {
    setSelectedLanguage(language);
  }, [language])

  const handleFilterClick = (filterKey) => {
    setSelectedFilter(filterKey);
    if (filterKey !== 'problem') {
      setSelectedCategory(null);
    }
  };

  useEffect(() => {
    const loadExhibitors = async () => {
      setLoading(true);

      try {
        // 1. เรียกใช้ Server Action และรับค่าที่ส่งกลับมา
        const result = await queryMatching();

        // 2. ตรวจสอบว่าผลลัพธ์เป็น Error Object ไหม
        if (result && result instanceof Error) {
          console.error('Error fetching exhibitors:', result);
          // อาจจะแสดงข้อความ Error ให้ผู้ใช้เห็น
        } else {
          // 3. ถ้าไม่ใช่ Error และมีข้อมูล
          setExhibitors(result || []); // ใช้งานค่าที่ส่งกลับมา
        }
      } catch (err) {
        // จัดการ Error ที่เกิดระหว่างการเรียกใช้ (ถ้ามี)
        console.error('An unexpected error occurred:', err);
      } finally {
        // สุดท้าย ตั้งค่า Loading เป็น false เสมอ
        setLoading(false);
      }
    };

    loadExhibitors();
  }, []);

  useEffect(() => {
    const loadProblemTags = async () => {
      try {
        const tagsResult = await loadProblemTag();
        if (tagsResult && tagsResult instanceof Error) {
          console.error('Error fetching exhibitors:', tagsResult);
        } else {
          setProblemTags(tagsResult || []);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProblemTags();
  }, []);

  const getTagStyle = (categoryName) => {
    if (!categoryName) {
      const fallback = '#e5e7eb';
      return {
        backgroundColor: fallback,
        borderColor: fallback,
        color: getTextColorFromBg(fallback),
      };
    }
    
    const matchedTag = problemTags.find(
      (tag) => tag.name.toLowerCase() === categoryName.toLowerCase()
    );
    const color = matchedTag?.color || '#e5e7eb';
    return {
      backgroundColor: color,
      borderColor: color,
      color: getTextColorFromBg(color),
    };
  };

  // Filter exhibitors based on visitor's selected interests
  let filteredExhibitors = exhibitors;

  // Only show exhibitors whose categories match visitor's interests
  if (userInterests.length > 0) {
    filteredExhibitors = exhibitors.filter((exhibitor) => {
      if (!exhibitor.categories || exhibitor.categories.length === 0) return false;
      return exhibitor.categories.some((category) =>
        userInterests.some((interest) =>
          category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(category.toLowerCase())
        )
      );
    });
  }

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
      className={` bg-white flex items-center justify-center p-3 h-fit sm:p-4 md:p-6 `}
    >
      <div className="w-full  sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative sm:shadow-none overflow-y-auto">
        {/* Content */}
        <div className="h-fit bg-white flex flex-col px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-y-auto">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-semibold text-gray-900 leading-snug mb-2">{t.titleUsermatching}</h1>
            <p className="text-xl text-gray-600">{t.descriptionUsermatching}</p>
          </div>

          {/* Map Image */}
          <div className="mb-4">
            <Image
              src={"/Map.jpg"}
              alt="Map"
              width={358}
              height={200}
              loading="eager"
              className="w-full h-auto rounded-lg"
              priority
            />
          </div>

          {/* Horizontal Store Cards - Show exhibitors matching visitor's interests */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {selectedLanguage.code === 'TH' ? 'กำลังโหลด...' : selectedLanguage.code === 'EN' ? 'Loading...' : '読み込み中...'}
            </div>
          ) : filteredExhibitors.length > 0 ? (
            <div className="relative w-full bg-white">
              {filteredExhibitors.map((exhibitor) => (
                <div
                  key={exhibitor.id}
                  className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-3  min-h-25 cursor-pointer transition hover:shadow-lg relative"
                  onClick={() => {
                    setSelectedExhibitor(selectedExhibitor?.id === exhibitor.id ? null : exhibitor);
                    setIsDropdownOpen(selectedExhibitor?.id === exhibitor.id ? !isDropdownOpen : true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedExhibitor(selectedExhibitor?.id === exhibitor.id ? null : exhibitor);
                      setIsDropdownOpen(selectedExhibitor?.id === exhibitor.id ? !isDropdownOpen : true);
                    }
                  }}
                >
                  <div className="flex items-center min-h-20 gap-4">
                    {/* Store Info and Actions */}
                    <div className="flex  flex-col justify-center min-h-20">
                      <div className='flex flex-col'>
                        {/* Store Name */}
                        <div className="flex items-start justify-between  gap-2">
                          <h3
                            className={`text-[16px] font-bold text-gray-900 mb-1 flex-1`}
                          >
                            {exhibitor.companyName || t.storeNameC}
                          </h3>
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
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {exhibitor.categories.slice(0, 2).map((category, catIndex) => (
                              <span
                                key={catIndex}
                                className="px-3 py-1 text-[12px] rounded-full flex items-center justify-center border"
                                style={getTagStyle(category)}
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Red Dropdown Menu */}
                  {selectedExhibitor?.id === exhibitor.id && isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-900 rounded-lg shadow-lg p-4 z-20 w-full">
                      {/* Company Name */}
                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{t.companyName}</label>
                        <p className="text-sm text-gray-900">{selectedExhibitor.companyName || '-'}</p>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-2 mb-3">
                        <label className="block text-xs font-semibold text-gray-600">{t.contactChannel}</label>

                        {(selectedExhibitor.companyWebsite || selectedExhibitor.website) && (
                          <div>
                            <span className="text-xs text-gray-500">{t.website}:</span>
                            <a
                              href={selectedExhibitor.companyWebsite || selectedExhibitor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 underline hover:text-blue-800"
                            >
                              {selectedExhibitor.companyWebsite || selectedExhibitor.website}
                            </a>
                          </div>
                        )}

                        {selectedExhibitor.address && (
                          <div>
                            <span className="text-xs text-gray-500">{t.address}:</span>
                            <p className="text-sm text-gray-900">{selectedExhibitor.address}</p>
                          </div>
                        )}

                        {!(selectedExhibitor.companyEmail || selectedExhibitor.email) &&
                          !(selectedExhibitor.companyPhone || selectedExhibitor.phone) &&
                          !(selectedExhibitor.companyWebsite || selectedExhibitor.website) &&
                          !selectedExhibitor.address && (
                            <p className="text-xs text-gray-500">-</p>
                          )}
                      </div>

                      {/* Company Description */}
                      {selectedExhibitor.companyDescription && (
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">{t.companyDescription}</label>
                          <p className="text-sm text-gray-900">{selectedExhibitor.companyDescription}</p>
                        </div>
                      )}

                      {/* Categories */}
                      {selectedExhibitor.categories && selectedExhibitor.categories.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-2">{t.categories}</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedExhibitor.categories.map((category, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-full border"
                                style={getTagStyle(category)}
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500 mb-4">
              {selectedLanguage.code === 'TH'
                ? 'ไม่พบผู้แสดงสินค้า'
                : selectedLanguage.code === 'EN'
                  ? 'No exhibitors found'
                  : '出展者が見つかりません'}
            </div>
          )}


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
        </div>
      </div>
    </div>
  );
}


