'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import localFont from 'next/font/local';
import { signInWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
import AuthNavbar from '../components/AuthNavbar';
import { auth, db } from '@/lib/firebase'; 
import { doc, getDoc } from "firebase/firestore";

const promptFont = localFont({
  src: [
    { path: '../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [
    { path: '../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' },
  ],
});

const translations = {
  TH: {
    loginTitle: 'เข้าสู่ระบบ',
    loginDescription: 'กรุณากรอกชื่อผู้ใช้ หรืออีเมล และรหัสผ่านเพื่อเข้าสู่ระบบ',
    usernameLabel: 'ผู้ใช้/อีเมล',
    usernamePlaceholder: 'กรุณากรอกชื่อผู้ใช้ หรือ อีเมล',
    passwordLabel: 'รหัสผ่าน',
    passwordPlaceholder: 'กรุณากรอกรหัสผ่าน',
    rememberMe: 'จดจำการเข้าสู่ระบบของฉัน',
    forgotPassword: 'ลืมรหัสผ่าน?',
    forgotPasswordAlert: 'ฟีเจอร์ลืมรหัสผ่านยังไม่พร้อมใช้งาน',
    loginButton: 'เข้าสู่ระบบ',
    loadingButton: 'กำลังเข้าสู่ระบบ...',
    registerQuestion: 'ยังไม่มีบัญชีใช่ไหม?',
    registerCTA: 'ลงทะเบียน',
    errors: {
      invalidCredentials: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      general: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง',
    },
  },
  JP: {
    loginTitle: 'ログイン',
    loginDescription: 'ユーザー名またはメールアドレスとパスワードを入力してください。',
    usernameLabel: 'ユーザー名 / メール',
    usernamePlaceholder: 'ユーザー名またはメールアドレスを入力',
    passwordLabel: 'パスワード',
    passwordPlaceholder: 'パスワードを入力してください',
    rememberMe: 'ログイン状態を保存する',
    forgotPassword: 'パスワードをお忘れですか？',
    forgotPasswordAlert: 'パスワードリセット機能はまだ利用できません。',
    loginButton: 'ログイン',
    loadingButton: 'ログイン中...',
    registerQuestion: 'アカウントをお持ちではありませんか？',
    registerCTA: '登録する',
    errors: {
      invalidCredentials: 'ユーザー名またはパスワードが正しくありません。',
      general: 'エラーが発生しました。もう一度お試しください。',
    },
  },
};

const verifyEligibility = async () => {
  const uid = await lookUidSesstion();
  if(uid) return router.replace('/')
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);

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

  const handleLanguageSelect = (option) => {
    setSelectedLanguage(option);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', option.code);
    }
    setIsLanguageOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorKey(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;
      const docRef = doc(db, "users", user.uid); 
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role === 'exhibitor' || userData.role === 'admin') {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', user.displayName || user.username);
          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userId', user.uid);
          localStorage.setItem('userEmail', user.email);
          if(userData.role === 'exhibitor'){
            router.push('/exhibitor-dashboard');
          }else{
            router.push('/admin-dashboard');
          }
          setIsLoading(false);
        } else {
          alert(selectedLanguage.code === 'TH' ? "ขออภัยคุณไม่มีสิทธิ์เข้าถึง" : "申し訳ございませんが、アクセス権限がありません");
          await signOut(auth);
          setIsLoading(false);
        }
      }else{
        alert("ไม่พบข้อมูลผู้ใช้ในระบบฐานข้อมูล (โปรดติดต่อเจ้าหน้าที่)");
        await signOut(auth);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      const errorMessage = selectedLanguage.code === 'TH'
        ? "อีเมลหรือรหัสผ่านไม่ถูกต้องครับ"
        : "メールアドレスまたはパスワードが正しくありません";
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const t = translations[selectedLanguage.code];

  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 md:p-6 ${currentFontClass}`}>
      <div className="w-full max-w-[390px] sm:max-w-[450px] md:max-w-[500px] min-h-screen sm:min-h-[600px] md:min-h-[700px] bg-white flex flex-col relative shadow-sm sm:shadow-none">
        {/* Header with Logo and Language Selector */}
        <AuthNavbar
          languageOptions={languageOptions}
          selectedLanguage={selectedLanguage}
          onLanguageSelect={handleLanguageSelect}
        />

        {/* Login Form - Centered */}
        <div className="flex-1 flex items-start sm:items-center justify-center px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md flex flex-col gap-3 sm:gap-4"
          >
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{t.loginTitle}</h2>
              <p className="text-xs sm:text-sm text-gray-500 px-2">{t.loginDescription}</p>
            </div>

            <div className="mt-3 sm:mt-4 md:mt-6">
              <label htmlFor="username" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base"
                placeholder={t.usernamePlaceholder}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm text-gray-700 mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm sm:text-base pr-10 sm:pr-12"
                  placeholder={t.passwordPlaceholder}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((v) => !v)}
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
              <div className="flex justify-start mt-1">
                <button
                  type="button"
                  className="text-gray-700 hover:text-gray-900 hover:underline text-xs sm:text-sm"
                  tabIndex={-1}
                  onClick={() => alert(t.forgotPasswordAlert)}
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs sm:text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-gray-700">{t.rememberMe}</span>
              </label>
            </div>

            {errorKey && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm mt-3 sm:mt-4">
                {t.errors[errorKey] || ''}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed mt-1 sm:mt-2"
            >
              {isLoading ? t.loadingButton : t.loginButton}
            </button>

            <div className="w-full text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 pb-3 sm:pb-4">
              {t.registerQuestion}{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-gray-900 font-semibold hover:underline"
              >
                {t.registerCTA}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
