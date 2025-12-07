'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useLanguage } from '@/app/contexts/LanguageProvider';
import translations from '@/app/components/translations';
import TranslationSelection from '../components/TranslationSelection';

export default function ExhibitorProfilePage() {
  const router = useRouter();

  const {language, toggleLanguage} = useLanguage();
const [selectedLanguage, setSelectedLanguage] = useState(language);
const t = translations[selectedLanguage.code];

useEffect(() => {
  setSelectedLanguage(language);
}, [language]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);

  // useEffect(() => {
  //   const storedLanguage =
  //     typeof window !== 'undefined' ? localStorage.getItem('selectedLanguage') : null;
  //   if (storedLanguage) {
  //     const foundOption = languageOptions.find((option) => option.code === storedLanguage);
  //     if (foundOption) {
  //       setSelectedLanguage(foundOption);
  //     }
  //   }

  //   const handleClickOutside = (event) => {
  //     if (
  //       languageDropdownRef.current &&
  //       !languageDropdownRef.current.contains(event.target)
  //     ) {
  //       setIsLanguageOpen(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    }
    router.push('/login');
  };

  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categories, setCategories] = useState(['']);
  const [problemTags, setProblemTags] = useState([]);
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    companyPhone: '',
    branchId: '',
    companyEmail: '',
    website: '',
    companyDescription: '',
    logo: null,
    logoPreview: null,
    logoUrl: '', // URL from Firebase Storage
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [isEditMode, setIsEditMode] = useState(false); // Edit mode disabled - view only
  const [isProfileSaved, setIsProfileSaved] = useState(false); // Track if profile has been saved

  const getTagOptions = (currentValue) => {
    if (!currentValue) {
      return problemTags;
    }
    return problemTags.includes(currentValue) ? problemTags : [currentValue, ...problemTags];
  };

  const handleCategoryChange = (index, value) => {
    if (!isEditMode) return; // Prevent changes when not in edit mode
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const handleInputChange = (field, value) => {
    if (!isEditMode) return; // Prevent changes when not in edit mode
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // handleEdit function removed - edit mode is disabled

  const handleLogoChange = (e) => {
    if (!isEditMode) return; // Prevent changes when not in edit mode
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage({ type: 'error', text: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB' });
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveMessage({ type: 'error', text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logo: file,
          logoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      setSaveMessage({ type: '', text: '' });
    }
  };

  useEffect(() => {
    const fetchProblemTags = async () => {
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

    fetchProblemTags();
  }, []);

  // Load existing profile data from Firebase
  useEffect(() => {
    const loadProfileData = async () => {
      if (typeof window === 'undefined') return;
      
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const profileRef = doc(db, 'exhibitors', userId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setFormData((prev) => ({
            ...prev,
            companyName: data.companyName || '',
            taxId: data.taxId || '',
            companyPhone: data.companyPhone || '',
            branchId: data.branchId || '',
            companyEmail: data.companyEmail || '',
            website: data.website || '',
            companyDescription: data.companyDescription || '',
            logoUrl: data.logoUrl || '',
            logoPreview: data.logoUrl || null,
          }));
          
          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
          
          // If profile exists, it's been saved before
          setIsProfileSaved(true);
          setIsEditMode(false); // Start in view mode if profile exists
        } else {
          // New account - ensure form is completely empty
          setFormData({
            companyName: '',
            taxId: '',
            companyPhone: '',
            branchId: '',
            companyEmail: '',
            website: '',
            companyDescription: '',
            logo: null,
            logoPreview: null,
            logoUrl: '',
          });
          setCategories(['']);
          setIsProfileSaved(false);
          setIsEditMode(true); // Start in edit mode for new accounts
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // On error, also ensure form is empty for new accounts
        setFormData({
          companyName: '',
          taxId: '',
          companyPhone: '',
          branchId: '',
          companyEmail: '',
          website: '',
          companyDescription: '',
          logo: null,
          logoPreview: null,
          logoUrl: '',
        });
        setCategories(['']);
        setIsProfileSaved(false);
        setIsEditMode(true);
      }
    };

    loadProfileData();
  }, []);

  const handleSave = async () => {
    if (typeof window === 'undefined') return;
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setSaveMessage({ type: 'error', text: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่' });
      return;
    }

    // Basic validation
    if (!formData.companyName || formData.companyName.trim() === '') {
      setSaveMessage({ type: 'error', text: 'กรุณากรอกชื่อบริษัท' });
      return;
    }

    if (categories.filter((cat) => cat).length === 0) {
      setSaveMessage({ type: 'error', text: 'กรุณาเลือกหมวดหมู่ความเชี่ยวชาญอย่างน้อย 1 หมวด' });
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      let logoUrl = formData.logoUrl; // Keep existing URL if no new logo

      // Upload logo to Firebase Storage if a new logo is selected
      if (formData.logo) {
        try {
          setSaveMessage({ type: '', text: 'กำลังอัปโหลดรูปภาพ...' });
        const logoRef = ref(storage, `exhibitors/${userId}/logo/${Date.now()}_${formData.logo.name}`);
        await uploadBytes(logoRef, formData.logo);
        logoUrl = await getDownloadURL(logoRef);
          setSaveMessage({ type: '', text: 'กำลังบันทึกข้อมูล...' });
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          setSaveMessage({ 
            type: 'error', 
            text: `เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${uploadError.message || 'ไม่สามารถอัปโหลดได้'}` 
          });
          setIsSaving(false);
          return;
        }
      }

      // Prepare data to save
      const profileData = {
        companyName: formData.companyName.trim(),
        taxId: formData.taxId.trim(),
        companyPhone: formData.companyPhone.trim(),
        branchId: formData.branchId.trim(),
        companyEmail: formData.companyEmail.trim(),
        website: formData.website.trim(),
        companyDescription: formData.companyDescription.trim(),
        logoUrl: logoUrl,
        categories: categories.filter((cat) => cat && cat.trim() !== ''), // Only save non-empty categories
        isComplete: true, // Mark profile as complete/saved
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      const profileRef = doc(db, 'exhibitors', userId);
      await setDoc(profileRef, profileData, { merge: true });

      // Update local state with new logo URL
      if (logoUrl !== formData.logoUrl) {
        setFormData((prev) => ({
          ...prev,
          logoUrl: logoUrl,
          logo: null, // Clear the file object after upload
        }));
      }

      setSaveMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จ' });
      setIsProfileSaved(true);
      setIsEditMode(false); // Switch to view mode after saving
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      let errorMessage = 'ไม่สามารถบันทึกข้อมูลได้';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'ไม่มีสิทธิ์ในการบันทึกข้อมูล กรุณาตรวจสอบการตั้งค่า Firebase';
      } else if (error.code === 'unavailable') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับ Firebase ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSaveMessage({ 
        type: 'error', 
        text: `เกิดข้อผิดพลาด: ${errorMessage}` 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f5f5f5] flex`}>
      <div className="w-full max-w-[390px] md:max-w-[1440px] mx-auto flex relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

       

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            {/* Dashboard Title */}
            <h1 className="text-4xl font-bold text-gray-900">{t.profileTitle}</h1>
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-end justify-end w-full">
              <div className="relative" ref={languageDropdownRef}>
                <div className="flex items-end h-9 justify-end gap-3 cursor-pointer">
                  <TranslationSelection />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-gray-800 text-white rounded-xl w-10 h-9 flex items-center justify-center hover:bg-gray-700 transition"
                    aria-label={t.logout}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M15 12H3M12 9l3 3-3 3M9 7V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#f5f5f5]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card for Exhibitor*/}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center py-6 px-6 gap-3">
                <div className="rounded-full overflow-hidden border border-gray-200 w-[120px] h-[120px] flex items-center justify-center bg-gray-100">
                  {formData.logoPreview ? (
                    <Image
                      src={formData.logoPreview}
                      alt={formData.companyName || 'Company Logo'}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {formData.companyName || 'Company Name'}
                  </h3>
                  {formData.branchId && (
                    <p className="text-sm text-gray-600">{t.branchId}: {formData.branchId}</p>
                  )}
                  {formData.taxId && (
                    <p className="text-xs text-gray-500 mt-1">{t.taxId}: {formData.taxId}</p>
                  )}
                  {formData.companyPhone && (
                    <p className="text-xs text-gray-400">{formData.companyPhone}</p>
                  )}
                  {formData.companyEmail && (
                    <p className="text-xs text-gray-400">{formData.companyEmail}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center w-full">
                  {categories.filter((cat) => cat).slice(0, 2).map((category, index) => (
                    <span
                      key={index}
                      className="px-4 py-1 text-[11px] bg-gray-100 text-gray-700 rounded-full border border-gray-200 flex items-center justify-center"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Profile Form */}
              <div className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.userInformation}</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="companyName">
                          {t.companyName}
                        </label>
                        <input
                          id="companyName"
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="taxId">
                          {t.taxId}
                        </label>
                        <input
                          id="taxId"
                          type="text"
                          value={formData.taxId}
                          onChange={(e) => handleInputChange('taxId', e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="companyPhone">
                          {t.companyPhone}
                        </label>
                        <input
                          id="companyPhone"
                          type="text"
                          value={formData.companyPhone}
                          onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="branchId">
                          {t.branchId}
                        </label>
                        <input
                          id="branchId"
                          type="text"
                          value={formData.branchId}
                          onChange={(e) => handleInputChange('branchId', e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="companyEmail">
                          {t.companyEmail}
                        </label>
                        <input
                          id="companyEmail"
                          type="email"
                          value={formData.companyEmail}
                          onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="website">
                          {t.companyWebsite}
                        </label>
                        <input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="logoUpload">
                          {t.companyLogo}
                        </label>
                        <label
                          htmlFor="logoUpload"
                          className={`flex items-center justify-center w-full h-[44px] border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 ${
                            isEditMode 
                              ? 'cursor-pointer hover:border-gray-400' 
                              : 'cursor-not-allowed opacity-50'
                          }`}
                        >
                          Upload Logo
                        </label>
                        <input 
                          id="logoUpload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={handleLogoChange}
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="companyDescription">
                        {t.companyDescription}
                      </label>
                      <textarea
                        id="companyDescription"
                        value={formData.companyDescription}
                        onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                        disabled={!isEditMode}
                        className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 min-h-[120px] ${
                          !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.tagsTitle}</h2>
                  <div className="flex flex-col gap-2">
                    {[0].map((index) => {
                      const currentValue = categories[index] || '';
                      const availableTags = getTagOptions(currentValue);
                      return (
                      <select
                        key={index}
                          value={currentValue}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                          disabled={!isEditMode}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm appearance-none ${
                            !isEditMode ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem',
                        }}
                      >
                        <option value="">{t.selectCategory}</option>
                          {availableTags.map((tag) => (
                            <option key={`profile-tag-${index}-${tag}`} value={tag}>
                              {tag}
                            </option>
                          ))}
                      </select>
                      );
                    })}
                  </div>
                </section>
                
                <section className="flex flex-col items-center gap-3">
                  {saveMessage.text && (
                    <div
                      className={`px-4 py-2 rounded-lg text-sm ${
                        saveMessage.type === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {saveMessage.text}
                    </div>
                  )}
                  {isEditMode ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                      className={`px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2 ${
                      isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                      {isSaving && (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isSaving ? (selectedLanguage.code === 'TH' ? 'กำลังบันทึก...' : selectedLanguage.code === 'EN' ? 'Saving...' : '保存中...') : t.saveNow}
                    </button>
                  ) : null
                  }
                </section>

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

