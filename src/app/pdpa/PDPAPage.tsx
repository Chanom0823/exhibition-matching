'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useConsent } from '../contexts/pdpa';
import { useActionCared } from '../contexts/action-cared';
import { useLanguage } from '@/app/contexts/LanguageProvider';
import translations from '@/app/components/translations';


const  PDPAPage =()=> {
  const [isLoading, setIsLoading] = useState(true);
  const { isAccepted, toggleConsent } = useConsent();
  const { isActionCared, toggleActionCared} = useActionCared();
  
  const {language, toggleLanguage} = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const t = translations[selectedLanguage.code];

useEffect(() => {
  setSelectedLanguage(language);
}, [language]);

  // Load PDPA content from Firebase
  useEffect(() => {
    const loadPdpaContent = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, 'pdpaContent', 'active');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.content) {
            // Generate HTML content from structured data
            const generateContent = (lang) => {
              const content = data.content[lang];
              if (!content) return '';
              
              const sectionLabels = {
                TH: {
                  section1: 'การเก็บรวบรวมข้อมูล',
                  section2: 'การใช้ข้อมูล',
                  section3: 'การเปิดเผยข้อมูล',
                  section4: 'สิทธิของท่าน',
                },
                JP: {
                  section1: 'データの収集',
                  section2: 'データの使用',
                  section3: 'データの開示',
                  section4: 'お客様の権利',
                },
              };
              
              return `
                <h2 class="text-xl font-bold mb-4">${content.subtitle || ''}</h2>
                <p class="mb-4">${content.intro || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">1. ${sectionLabels[lang]?.section1 || ''}</h3>
                <p class="mb-4">${content.section1 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">2. ${sectionLabels[lang]?.section2 || ''}</h3>
                <p class="mb-4">${content.section2 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">3. ${sectionLabels[lang]?.section3 || ''}</h3>
                <p class="mb-4">${content.section3 || ''}</p>
                
                <h3 class="text-lg font-semibold mb-2 mt-6">4. ${sectionLabels[lang]?.section4 || ''}</h3>
                <p class="mb-4">${content.section4 || ''}</p>
              `;
            };
            
          }
        }
      } catch (error) {
        console.error('Error loading PDPA content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdpaContent();
  }, []);

  const [isAcceptedPDPA, setIsAcceptedPDPA] = useState(isAccepted);
  useEffect(() => {
    setIsAcceptedPDPA(isAccepted);
  }, [isAccepted]);

  return (
    <div
      className={` -mt-5 `}
    >
      <div className="w-full  max-w-[390px] sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px]  flex flex-col relative shadow-sm sm:shadow-none overflow-y-auto">

        {/* Content */}
        <div className="flex-1 flex flex-col px-4 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {t.pdpaTitle}
              </h1>
              <div 
                className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: t.pdpaContent }}
          />

          <div  className="mt-auto gitflex flex-col gap-4 pb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isAcceptedPDPA}
                onChange={(e) => setIsAcceptedPDPA(e.target.checked)}
                    className="mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">
                {t.pdpaAcceptLabel}
              </span>
            </label>
            <button
              type="submit"
              disabled={!isAcceptedPDPA}
              onClick={() => {
                toggleConsent(isAcceptedPDPA);
                toggleActionCared(false)
              }}
                  className="w-full mt-5 bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.pdpaAcceptButton}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDPAPage;