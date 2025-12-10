'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'; // เพิ่ม useMemo, useCallback
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '../contexts/LanguageProvider';
import translations from '../components/translations';
import { loadProblemTag, queryMatching, } from './action';

// ย้ายฟังก์ชัน Helper ออกมาข้างนอก (จะได้ไม่ถูกสร้างใหม่ทุกรอบ)
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
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInterests, setUserInterests] = useState([]); // อย่าลืมหาที่ set ค่าให้ตัวแปรนี้นะ!
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [problemTags, setProblemTags] = useState([]);
  const { language } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  
  // ป้องกัน undefined error
  const t = translations[selectedLanguage?.code] || translations.TH;

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // --- Load Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // โหลดข้อมูลพร้อมกัน (Parallel) เพื่อความเร็ว
        const [matchingResult, tagsResult] = await Promise.all([
            queryMatching(),
            loadProblemTag()
        ]);

        if (matchingResult && !(matchingResult instanceof Error)) {
            setExhibitors(matchingResult || []);
        }
        
        if (tagsResult && !(tagsResult instanceof Error)) {
            setProblemTags(tagsResult || []);
        }

      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Optimization 1: แปลง Array เป็น Map เพื่อการค้นหาที่เร็วระดับแสง (O(1)) ---
  const tagsMap = useMemo(() => {
    const map = new Map();
    problemTags.forEach(tag => {
        if (tag.name) map.set(tag.name.toLowerCase(), tag);
    });
    return map;
  }, [problemTags]);

  // --- Optimization 2: ใช้ useCallback และดึงค่าจาก Map ---
  const getTagStyle = useCallback((categoryName) => {
    if (!categoryName) return { backgroundColor: '#e5e7eb', color: '#111827' };
    
    // หาจาก Map แทนการ .find ใน Array (เร็วกว่ามาก)
    const matchedTag = tagsMap.get(categoryName.toLowerCase());
    const color = matchedTag?.color || '#e5e7eb';
    
    return {
      backgroundColor: color,
      borderColor: color,
      color: getTextColorFromBg(color),
    };
  }, [tagsMap]);

  // --- Optimization 3: คำนวณ filteredExhibitors เฉพาะเมื่อข้อมูลเปลี่ยน ---
  const filteredExhibitors = useMemo(() => {
    if (!userInterests || userInterests.length === 0) return exhibitors;

    return exhibitors.filter((exhibitor) => {
      if (!exhibitor.categories || exhibitor.categories.length === 0) return false;
      return exhibitor.categories.some((category) =>
        userInterests.some((interest) =>
          category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(category.toLowerCase())
        )
      );
    });
  }, [exhibitors, userInterests]);


  return (
    <div className="bg-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">
        
        <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-y-auto">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-semibold text-gray-900 leading-snug mb-2">{t?.titleUsermatching}</h1>
            <p className="text-xl text-gray-600">{t?.descriptionUsermatching}</p>
          </div>

          <div className="mb-4">
            <Image
              src={"/Map.jpg"}
              alt="Map"
              width={358}
              height={200}
              className="w-full h-full rounded-lg object-contain"
              priority
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {selectedLanguage?.code === 'JP' ? '読み込み中...' : 'กำลังโหลด...'}
            </div>
          ) : filteredExhibitors.length > 0 ? (
            <div className="relative w-full">
              {/* ใช้ Slice เพื่อจำกัดจำนวนการแสดงผลเบื้องต้น ถ้าข้อมูลเยอะเกินไป */}
              {filteredExhibitors.slice(0, 50).map((exhibitor) => (
                <div
                  key={exhibitor.id}
                  className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-3 min-h-25 cursor-pointer transition hover:shadow-lg relative"
                  onClick={() => {
                    setSelectedExhibitor(selectedExhibitor?.id === exhibitor.id ? null : exhibitor);
                    setIsDropdownOpen(selectedExhibitor?.id === exhibitor.id ? !isDropdownOpen : true);
                  }}
                >
                  <div className="flex items-center min-h-20 gap-4">
                    <div className="flex flex-col justify-center min-h-20 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[16px] font-bold text-gray-900 mb-1 flex-1">
                          {exhibitor.companyName || t?.storeNameC}
                        </h3>
                      </div>

                      {exhibitor.companyDescription && (
                        <p className="text-[11px] font-medium text-gray-700 mb-2 line-clamp-1">
                          {exhibitor.companyDescription.substring(0, 40)}...
                        </p>
                      )}

                      {exhibitor.categories && exhibitor.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {exhibitor.categories.slice(0, 2).map((category, catIndex) => (
                            <span
                              key={catIndex}
                              className="px-3 py-1 text-[12px] rounded-full flex items-center justify-center border"
                              style={getTagStyle(category)} // เรียกใช้ฟังก์ชันที่ optimize แล้ว
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {selectedExhibitor?.id === exhibitor.id && isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-900 rounded-lg shadow-lg p-4 z-20 w-full border border-gray-100">
                        {/* ... (เนื้อหา Dropdown เหมือนเดิม) ... */}
                        <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">{t?.companyName}</label>
                            <p className="text-sm text-gray-900">{selectedExhibitor.companyName || '-'}</p>
                        </div>
                         {/* ... ใส่ส่วนที่เหลือกลับมาได้เลยจ้ะ ... */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500 mb-4">
               {t?.noExhibitorsFound || 'ไม่พบข้อมูล'}
            </div>
          )}

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
            >
              {t?.backHome}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}