'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import localFont from 'next/font/local';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
  EN: {
    loginTitle: 'Sign in',
    loginDescription: 'Please enter your username or email, and password to continue.',
    usernameLabel: 'Username / Email',
    usernamePlaceholder: 'Enter username or email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember my login',
    forgotPassword: 'Forgot password?',
    forgotPasswordAlert: 'Forgot password feature is not available yet.',
    loginButton: 'Sign in',
    loadingButton: 'Signing in...',
    registerQuestion: "Don't have an account?",
    registerCTA: 'Register',
    errors: {
      invalidCredentials: 'Incorrect username or password.',
      general: 'Something went wrong. Please try again.',
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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'EN', label: 'English' },
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

    // กรณีเจ้าของระบบ (owner) ใช้ credential พิเศษ
    if (username === 'owner1' && password === '12345') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', 'owner');
      localStorage.setItem('userId', 'owner');
      localStorage.setItem('userEmail', 'owner@example.com');
      router.push('/owner-dashboard');
      setIsLoading(false);
      return;
    }

    // กรณี admin / organizer
    if (username === 'admin' && password === '12345') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', 'organizer');
      localStorage.setItem('userId', 'admin');
      localStorage.setItem('userEmail', 'admin@example.com');
      router.push('/organizer-dashboard');
      setIsLoading(false);
      return;
    }

    // กรณี admin dashboard
    if (username === 'admin1234' && password === '123456@') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userId', 'admin1234');
      localStorage.setItem('userEmail', 'admin1234@example.com');
      router.push('/admin-dashboard');
      setIsLoading(false);
      return;
    }

    try {
      let identifier = username.trim();
      let exhibitorProfile = null;

      if (!identifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('usernameLower', '==', identifier.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setErrorKey('invalidCredentials');
          setIsLoading(false);
          return;
        }

        exhibitorProfile = querySnapshot.docs[0].data();
        identifier = exhibitorProfile.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);

      if (!exhibitorProfile) {
        const profileSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (profileSnap.exists()) {
          exhibitorProfile = profileSnap.data();
        }
      }

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', exhibitorProfile?.username || identifier);
      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('userEmail', exhibitorProfile?.email || identifier);
      localStorage.setItem('userRole', exhibitorProfile?.role || 'user');
      
      setIsLoading(false);
      // Redirect ไปหน้า exhibitor dashboard
      router.push('/exhibitor-dashboard');
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        setErrorKey('invalidCredentials');
      } else {
        setErrorKey('general');
      }
      setIsLoading(false);
    }
  };

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center p-4 ${currentFontClass}`}>
      <div className="w-full max-w-[390px] min-h-screen md:min-h-[600px] bg-white flex flex-col relative">
        {/* Header with Logo and Language Selector */}
        <div className="w-full min-h-[64px] flex justify-between items-center px-4 py-[10px]">
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

        {/* Login Form - Centered */}
        <div className="flex-1 flex items-top justify-center px-4 py-8 md:py-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md flex flex-col gap-4"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{t.loginTitle}</h2>
              <p className="text-sm text-gray-500">{t.loginDescription}</p>
            </div>

            <div className="mt-4 md:mt-6">
              <label htmlFor="username" className="block text-sm text-gray-700 mb-1.5">
                {t.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm md:text-base"
                placeholder={t.usernamePlaceholder}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm md:text-base pr-12"
                  placeholder={t.passwordPlaceholder}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="แสดงรหัสผ่าน"
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path d="M1.667 10S4.167 4.167 10 4.167 18.333 10 18.333 10 15.833 15.833 10 15.833 1.667 10 1.667 10z" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path d="M1.667 10S4.167 4.167 10 4.167c1.53 0 2.87.29 4.01.77M18.333 10s-2.5 5.833-8.333 5.833c-1.53 0-2.87-.29-4.01-.77M7.5 7.5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-start mt-1  ">
                <button
                  type="button"
                  className="text-gray-700 hover:text-gray-900 hover:underline text-sm"
                  tabIndex={-1}
                  onClick={() => alert(t.forgotPasswordAlert)}
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer" 
                />
                <span className="text-gray-700">{t.rememberMe}</span>
              </label>
            </div>

            {errorKey && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
                {t.errors[errorKey] || ''}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t.loadingButton : t.loginButton}
            </button>

            <div className="w-full text-center text-sm text-gray-500 mt-4 pb-4">
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

