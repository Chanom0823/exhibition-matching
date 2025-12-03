'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import localFont from 'next/font/local';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import translations from '@/app/components/translations';

const promptFont = localFont({
  src: [
    { path: '../../../../public/fonts/Prompt-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../../../public/fonts/Prompt-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../../../public/fonts/Prompt-Bold.ttf', weight: '700', style: 'normal' },
  ],
});

const sawarabiFont = localFont({
  src: [{ path: '../../../../public/fonts/SawarabiGothic-Regular.ttf', weight: '400', style: 'normal' }],
});

export default function ProblemTagManagementPage() {
  const router = useRouter();
  const languageOptions = [
    { code: 'TH', label: 'ภาษาไทย' },
    { code: 'JP', label: '日本語' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('problemTagManagement');
  const languageDropdownRef = useRef(null);

  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tagMessage, setTagMessage] = useState({ type: '', text: '' });
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const t = translations[selectedLanguage.code];
  const currentFontClass =
    selectedLanguage.code === 'JP' ? sawarabiFont.className : promptFont.className;

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

  const handleTabClick = (targetTab) => {
    setActiveTab(targetTab);
    if (targetTab === 'dashboard') {
      router.push('/admin-dashboard');
    } else if (targetTab === 'userManagement') {
      router.push('/admin-dashboard/user-management');
    } else if (targetTab === 'problemTagManagement') {
      router.push('/admin-dashboard/problem-tag-management');
    } else if (targetTab === 'homepageManagement') {
      router.push('/admin-dashboard/homepage-management');
    } else if (targetTab === 'pdpaManagement') {
      router.push('/admin-dashboard/pdpa-management');
    }
  };

  useEffect(() => {
    const tagsRef = collection(db, 'problemTags');
    const tagsQuery = query(tagsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      tagsQuery,
      (snapshot) => {
        const fetchedTags = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '-',
            description: data.description || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
          };
        });
        setTags(fetchedTags);
        setTagsLoading(false);
      },
      (error) => {
        console.error('Error fetching tags:', error);
        setTagsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      setTagMessage({ type: 'error', text: t.tagNameRequiredProblemTagManagement });
      return;
    }
    const duplicate = tags.some(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setTagMessage({ type: 'error', text: t.tagDuplicateProblemTagManagement });
      return;
    }

    try {
      setAddingTag(true);
      setTagMessage({ type: '', text: '' });
      await addDoc(collection(db, 'problemTags'), {
        name: trimmed,
        description: newTagDescription.trim() || '',
        createdAt: serverTimestamp(),
      });
      setNewTagName('');
      setNewTagDescription('');
      setTagMessage({ type: 'success', text: t.saveButtonProblemTagManagement });
      setTimeout(() => setTagMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error adding tag:', error);
      setTagMessage({ type: 'error', text: t.tagAddErrorProblemTagManagement });
    } finally {
      setAddingTag(false);
    }
  };

  const startEditTag = (tag) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name || '');
    setEditingDescription(tag.description || '');
    setTagMessage({ type: '', text: '' });
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
    setEditingName('');
    setEditingDescription('');
    setTagMessage({ type: '', text: '' });
  };

  const handleUpdateTag = async () => {
    if (!editingTagId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setTagMessage({ type: 'error', text: t.tagNameRequiredProblemTagManagement });
      return;
    }

    const duplicate = tags.some(
      (tag) =>
        tag.id !== editingTagId && tag.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setTagMessage({ type: 'error', text: t.tagDuplicateProblemTagManagement });
      return;
    }

    try {
      setTagMessage({ type: '', text: '' });
      await updateDoc(doc(db, 'problemTags', editingTagId), {
        name: trimmed,
        description: editingDescription.trim() || '',
      });
      setTagMessage({ type: 'success', text: t.tagUpdateSuccessProblemTagManagement });
      setEditingTagId(null);
      setEditingName('');
      setEditingDescription('');
      setTimeout(() => setTagMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Error updating tag:', error);
      setTagMessage({ type: 'error', text: t.tagUpdateErrorProblemTagManagement});
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await deleteDoc(doc(db, 'problemTags', tagId));
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f5f5f5] flex ${currentFontClass}`}>
      <div className="w-full max-w-[390px] md:max-w-[1440px] mx-auto flex relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-[250px] bg-white border-r border-gray-200 flex-col transform transition-transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } md:flex`}
        >
          <div className="px-4 py-4 items-center justify-center flex">
            <Image src="/logo.svg" alt="alt design office" width={110} height={60} priority />
          </div>

          <nav className="flex-1 px-4 py-4">
            <div className="flex flex-col gap-2">
              {t.tabs.map((tab, idx) => {
                const tabKeys = ['dashboard', 'userManagement', 'problemTagManagement', 'homepageManagement'];
                const targetTab = tabKeys[idx] || 'dashboard';

                const getIcon = (index) => {
                  if (index === 0) {
                    return <Image src="/dashboard.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  }
                  if (index === 1) {
                    return <Image src="/user.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  }
                  if (index === 2) {
                    return <Image src="/file.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  }
                  if (index === 3) {
                    return <Image src="/home.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  }
                  if (index === 4) {
                    return <Image src="/verify.png" alt={tab} width={24} height={24} className="w-6 h-6" />;
                  }
                  return null;
                };

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabClick(targetTab)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === targetTab
                        ? 'bg-gray-100 text-gray-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {getIcon(idx)}
                    {tab}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="px-4 md:px-10 py-4 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 whitespace-nowrap">{t.pageTitleProblemTagManagement}</h1>
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
                <div className="flex items-end justify-end gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setIsLanguageOpen((prev) => !prev)}
                    className="bg-gray-800 text-white rounded-lg w-[72px] h-[36px] text-sm flex items-center justify-center gap-1.5 hover:bg-gray-700 transition"
                  >
                    {selectedLanguage.code}
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
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-gray-800 text-white rounded-xl w-[40px] h-[36px] flex items-center justify-center hover:bg-gray-700 transition"
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
                {isLanguageOpen && (
                  <ul
                    className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10"
                    role="listbox"
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
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-4 bg-[#f5f5f5]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 order-2 md:order-2 min-h-[340px] flex flex-col md:sticky md:top-4 md:self-start">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.createTagTitle}</h2>
                <p className="text-sm text-gray-500 mb-5">{t.descriptionProblemTagManagement }</p>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="tag-name">
                      {t.tagNameLabel}
                    </label>
                    <input
                      id="tag-name"
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder={t.tagNamePlaceholder}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="tag-description">
                      {t.tagDescriptionLabel}
                    </label>
                    <textarea
                      id="tag-description"
                      type="text"
                      value={newTagDescription}
                      onChange={(e) => setNewTagDescription(e.target.value)}
                      placeholder={t.tagDescriptionPlaceholder}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
                    />
                  </div>
                  {tagMessage.text && (
                    <p
                      className={`text-xs ${
                        tagMessage.type === 'error' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {tagMessage.text}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={addingTag}
                  className={`w-full md:w-auto px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition ${
                    addingTag ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {addingTag ? '...' : t.saveButtonProblemTagManagement}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 order-1 md:order-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.tagListTitle}</h2>
                {tagsLoading ? (
                  <p className="text-sm text-gray-500">{t.loadingProblemTagManagement}</p>
                ) : tags.length === 0 ? (
                  <p className="text-sm text-gray-500">{t.emptyState}</p>
                ) : (
                  <div className="space-y-3">
                    {tags.map((tag) => {
                      const isEditing = editingTagId === tag.id;
                      return (
                        <div
                          key={tag.id}
                          className="flex items-start justify-between gap-4 border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition"
                        >
                          <div className="flex-1 space-y-1">
                            {isEditing ? (
                              <>
                                <div>
                                  <label
                                    className="block text-xs font-medium text-gray-600 mb-1"
                                    htmlFor={`edit-name-${tag.id}`}
                                  >
                                    {t.tagNameLabel}
                                  </label>
                                  <input
                                    id={`edit-name-${tag.id}`}
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                                  />
                                </div>
                                <div>
                                  <label
                                    className="block text-xs font-medium text-gray-600 mb-1"
                                    htmlFor={`edit-desc-${tag.id}`}
                                  >
                                    {t.tagDescriptionLabel}
                                  </label>
                                  <textarea
                                    id={`edit-desc-${tag.id}`}
                                    rows={2}
                                    value={editingDescription}
                                    onChange={(e) => setEditingDescription(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-gray-900">{tag.name}</p>
                                {tag.description && (
                                  <p className="text-xs text-gray-600 mt-1">{tag.description}</p>
                                )}
                              </>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {tag.createdAt
                                ? tag.createdAt.toLocaleDateString(
                                    selectedLanguage.code === 'TH'
                                      ? 'th-TH'
                                      : selectedLanguage.code === 'JP'
                                      ? 'ja-JP'
                                      : 'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )
                                : '—'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleUpdateTag}
                                  className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition"
                                >
                                  {t.updateButtonProblemTagManagement}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditTag}
                                  className="px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition"
                                >
                                  {t.cancelButtonProblemTagManagement}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditTag(tag)}
                                  className="text-xs font-medium text-gray-700 hover:text-gray-900"
                                >
                                  {t.editButtonProblemTagManagement}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="text-xs font-medium text-red-500 hover:text-red-600"
                                >
                                  {t.deleteButtonProblemTagManagement}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

