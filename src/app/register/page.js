'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AuthNavbar from '../components/AuthNavbar';

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
    title: 'ลงทะเบียน',
    subtitle: 'สร้างบัญชีเพื่อดำเนินการต่อ!',
    fields: {
      fullName: 'ชื่อ - นามสกุล',
      username: 'ชื่อผู้ใช้',
      email: 'อีเมล',
      phone: 'เบอร์โทรศัพท์',
      password: 'ตั้งรหัสผ่าน',
      confirmPassword: 'ยืนยันรหัสผ่าน',
    },
    placeholders: {
      fullName: 'กรุณากรอกชื่อ - นามสกุล',
      username: 'กรุณากรอกชื่อผู้ใช้',
      email: 'กรุณากรอกอีเมล',
      phone: 'กรุณากรอกหมายเลขโทรศัพท์',
      password: 'กรุณากรอกรหัสผ่าน',
      confirmPassword: 'กรุณากรอกยืนยันรหัสผ่าน',
    },
    actions: {
      register: 'ลงทะเบียน',
      haveAccountText: 'มีบัญชีอยู่แล้วใช่ไหม?',
      login: 'เข้าสู่ระบบ',
      back: 'ย้อนกลับ',
    },
    errors: {
      missingFields: 'กรุณากรอกข้อมูลให้ครบถ้วน',
      passwordMismatch: 'รหัสผ่านไม่ตรงกัน',
      passwordLength: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว และมีตัวพิมพ์เล็ก-ใหญ่ พร้อมอักขระพิเศษอย่างน้อย 1 ตัว',
      passwordHint: 'รหัสผ่านอย่างน้อย 8 ตัว ประกอบด้วยตัวพิมพ์ใหญ่-เล็ก และอักขระพิเศษอย่างน้อย 1 ตัว',
      passwordRules: [
        'ความยาวอย่างน้อย 8 ตัวอักษร',
        'ต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่และพิมพ์เล็ก',
        'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว',
      ],
      usernameExists: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',
      invalidUsername: 'ชื่อผู้ใช้ต้องมีตัวอักษรอย่างน้อย 1 ตัว (ห้ามเป็นตัวเลขล้วน อักษรพิเศษล้วน หรือตัวเลขกับอักษรพิเศษล้วน)',
      emailExists: 'อีเมลนี้ถูกใช้งานแล้ว',
      invalidPhone: 'กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง',
      phoneExists: 'หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว',
      general: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง',
    },
    success: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ',
  },
  JP: {
    title: '登録',
    subtitle: 'アカウントを作成して続行しましょう！',
    fields: {
      fullName: '氏名',
      username: 'ユーザー名',
      email: 'メールアドレス',
      phone: '電話番号',
      password: 'パスワード設定',
      confirmPassword: 'パスワード確認',
    },
    placeholders: {
      fullName: '氏名を入力してください',
      username: 'ユーザー名を入力してください',
      email: 'メールアドレスを入力してください',
      phone: '電話番号を入力してください',
      password: 'パスワードを入力してください',
      confirmPassword: 'パスワードを再入力してください',
    },
    actions: {
      register: '登録する',
      haveAccountText: 'すでにアカウントをお持ちですか？',
      login: 'ログイン',
      back: '戻る',
    },
    errors: {
      missingFields: '必須項目を入力してください',
      passwordMismatch: 'パスワードが一致しません',
      passwordLength: 'パスワードは最低8文字で、大文字・小文字・記号を各1文字以上含めてください',
      passwordHint: '最低8文字で、大文字・小文字・記号を最低1文字ずつ含めてください。',
      passwordRules: [
        '文字数は最低8文字',
        '大文字と小文字を含めてください',
        '記号を最低1文字含めてください',
      ],
      usernameExists: 'このユーザー名は既に使用されています',
      invalidUsername: 'ユーザー名には最低1文字の文字を含める必要があります（数字のみ、記号のみ、数字と記号のみは不可）',
      emailExists: 'このメールアドレスは既に使用されています',
      invalidPhone: '有効な電話番号を入力してください',
      phoneExists: 'この電話番号は既に使用されています',
      general: '登録に失敗しました。もう一度お試しください。',
    },
    success: '登録完了しました！ログインしてください。',
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const phoneCountryOptions = [
    { code: '+66', label: 'ไทย', flag: '🇹🇭' },
    { code: '+1', label: 'USA', flag: '🇺🇸' },
    { code: '+81', label: '日本', flag: '🇯🇵' },
  ];
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(phoneCountryOptions[0]);
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);

  const languageDropdownRef = useRef(null);
  const phoneDropdownRef = useRef(null);

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
        phoneDropdownRef.current &&
        !phoneDropdownRef.current.contains(event.target)
      ) {
        setIsPhoneDropdownOpen(false);
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

  const handlePhoneCountrySelect = (option) => {
    setSelectedPhoneCountry(option);
    setIsPhoneDropdownOpen(false);
  };

  const sanitizeLettersOnly = (value, allowSpaces = false) => {
    const pattern = allowSpaces
      ? /[^a-zA-Zก-๙ぁ-んァ-ヶー一-龯\s]/g
      : /[^a-zA-Zก-๙ぁ-んァ-ヶー一-龯]/g;
    return value.replace(pattern, '');
  };

  const sanitizeDigitsOnly = (value) => value.replace(/[^\d]/g, '');

  const handleLetterInputChange = (e, allowSpaces = false) => {
    const sanitizedValue = sanitizeLettersOnly(e.target.value, allowSpaces);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: sanitizedValue,
    }));
    setError('');
  };

  const handlePhoneChange = (e) => {
    const sanitizedValue = sanitizeDigitsOnly(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phoneNumber: sanitizedValue,
    }));
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();
    const sanitizedPhone = sanitizeDigitsOnly(formData.phoneNumber || '');
    const formattedPhone = `${selectedPhoneCountry.code} ${sanitizedPhone}`.trim();

    if (
      !trimmedUsername ||
      !trimmedEmail ||
      !sanitizedPhone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError(translations[selectedLanguage.code].errors.missingFields);
      setIsLoading(false);
      return;
    }

    if (sanitizedPhone.length < 8 || sanitizedPhone.length > 15) {
      setError(translations[selectedLanguage.code].errors.invalidPhone);
      setIsLoading(false);
      return;
    }

    const hasLetter = /[a-zA-Zก-๙ぁ-んァ-ヶー一-龯]/.test(trimmedUsername);
    if (!hasLetter) {
      setError(translations[selectedLanguage.code].errors.invalidUsername);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(translations[selectedLanguage.code].errors.passwordMismatch);
      setIsLoading(false);
      return;
    }

    const passwordRule =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{}|\\:;"'<>,.?/~`]).{8,}$/;
    if (!passwordRule.test(formData.password)) {
      setError(translations[selectedLanguage.code].errors.passwordLength);
      setIsLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const usernameQuery = query(
        usersRef,
        where('usernameLower', '==', trimmedUsername.toLowerCase())
      );
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        setError(translations[selectedLanguage.code].errors.usernameExists);
        setIsLoading(false);
        return;
      }

      const phoneQuery = query(
        usersRef,
        where('phoneNumber', '==', formattedPhone)
      );
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        setError(translations[selectedLanguage.code].errors.phoneExists);
        setIsLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        formData.password
      );

      const userDoc = {
        uid: userCredential.user.uid,
        username: trimmedUsername,
        usernameLower: trimmedUsername.toLowerCase(),
        email: trimmedEmail,
        phoneNumber: formattedPhone,
        phoneCountry: selectedPhoneCountry.code,
        role: 'exhibitor',
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      await signOut(auth);

      setIsLoading(false);
      alert(translations[selectedLanguage.code].success);
      router.push('/login');
    } catch (error) {
      console.error('Error registering user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError(translations[selectedLanguage.code].errors.emailExists);
      } else {
        setError(translations[selectedLanguage.code].errors.general);
      }
      setIsLoading(false);
    }
  };

  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;
  const t = translations[selectedLanguage.code];

  return (
    <div className={`bg-white flex items-center justify-center p-3 sm:p-4 md:p-6 ${currentFontClass}`}>
      <div className="w-full max-w-[390px] sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none">
        {/* Navbar */}
        <AuthNavbar
          languageOptions={languageOptions}
          selectedLanguage={selectedLanguage}
          onLanguageSelect={handleLanguageSelect}
        />

        <div className="px-3 sm:px-4 md:px-6 py-[10px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">{t.actions.back}</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 pt-4 pb-6 gap-3 sm:gap-4 overflow-y-auto">
          <div className="text-center mb-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{t.title}</h2>
            <p className="text-xs sm:text-sm text-gray-500 px-2">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 sm:gap-4">
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.fields.username}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                placeholder={t.placeholders.username}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.fields.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                placeholder={t.placeholders.email}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.fields.phone}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative" ref={phoneDropdownRef}>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 sm:px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 bg-white hover:bg-gray-50"
                    onClick={() => setIsPhoneDropdownOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isPhoneDropdownOpen}
                  >
                    <span className="text-base sm:text-lg">{selectedPhoneCountry.flag}</span>
                    <span className="font-medium">{selectedPhoneCountry.code}</span>
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
                  {isPhoneDropdownOpen && (
                    <ul
                      className="absolute left-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
                      role="listbox"
                      aria-label="เลือกประเทศ"
                    >
                      {phoneCountryOptions.map((option) => (
                        <li key={option.code}>
                          <button
                            type="button"
                            className={`w-full flex items-center gap-2 px-4 py-2 text-xs sm:text-sm ${
                              selectedPhoneCountry.code === option.code
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => handlePhoneCountrySelect(option)}
                            role="option"
                            aria-selected={selectedPhoneCountry.code === option.code}
                          >
                            <span className="text-base sm:text-lg">{option.flag}</span>
                            <span className="font-medium">{option.code}</span>
                            <span className="text-xs text-gray-500">{option.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                  placeholder={t.placeholders.phone}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.fields.password}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base pr-10 sm:pr-12"
                  placeholder={t.placeholders.password}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="แสดงรหัสผ่าน"
                >
                  {showPassword ? (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 20 20">
                      <path d="M1.667 10S4.167 4.167 10 4.167 18.333 10 18.333 10 15.833 15.833 10 15.833 1.667 10 1.667 10z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 20 20">
                      <path d="M1.667 10S4.167 4.167 10 4.167c1.53 0 2.87.29 4.01.77M18.333 10s-2.5 5.833-8.333 5.833c-1.53 0-2.87-.29-4.01-.77M7.5 7.5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                {(t.errors.passwordRules || [t.errors.passwordHint]).map((rule, index) => (
                  <div key={rule + index} className="flex gap-2">
                    <span>•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.fields.confirmPassword}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base pr-10 sm:pr-12"
                  placeholder={t.placeholders.confirmPassword}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label="แสดงรหัสผ่าน"
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 20 20">
                      <path d="M1.667 10S4.167 4.167 10 4.167 18.333 10 18.333 10 15.833 15.833 10 15.833 1.667 10 1.667 10z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" fill="none" viewBox="0 0 20 20">
                      <path d="M1.667 10S4.167 4.167 10 4.167c1.53 0 2.87.29 4.01.77M18.333 10s-2.5 5.833-8.333 5.833c-1.53 0-2.87-.29-4.01-.77M7.5 7.5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm mt-3 sm:mt-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed mt-1 sm:mt-2"
            >
              {isLoading ? `${t.actions.register}...` : t.actions.register}
            </button>
          </form>
          <div className="w-full text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 pb-3 sm:pb-4">
            {t.actions.haveAccountText}{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-gray-900 font-semibold hover:underline"
            >
              {t.actions.login}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

