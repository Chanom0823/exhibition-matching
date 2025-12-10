'use client';

import React from 'react';

type SearchFilterProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;

  tagNameFilter: string;
  onTagNameChange: (value: string) => void;

  tagColorFilter: string;
  onTagColorChange: (value: string) => void;

  uniqueTagNames: string[];
  uniqueTagColors: string[];

  languageCode: string; // 'TH' | 'JP' ก็ได้ ถ้าคุณอยากเข้มขึ้น
};

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  tagNameFilter,
  onTagNameChange,
  tagColorFilter,
  onTagColorChange,
  uniqueTagNames,
  uniqueTagColors,
  languageCode,
}) => {
  const isTH = languageCode === 'TH';

  return (
    <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      {/* 🔍 Search */}
      <div className="w-full md:max-w-xs">
        <label className="block text-lg text-gray-900 mb-1  font-bold">
          {isTH ? 'ค้นหาชื่อผู้ใช้งาน / บริษัท' : '出展者を検索'}
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            isTH
              ? 'พิมพ์ชื่อผู้ใช้งานหรือชื่อบริษัท'
              : 'ユーザー名または会社名を入力してください。'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none bg-white text-gray-600"
        />
      </div>

      {/* 🎨 Filter by Tag Name & Color */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        {/* Tag name */}
        <div className="flex flex-col">
          <span className="text-lg text-gray-900 mb-1 font-bold">
            {isTH ? 'ชื่อแท็ก' : 'タグ名でフィルター'}
          </span>
          <select
            value={tagNameFilter}
            onChange={(e) => onTagNameChange(e.target.value)}
            className="w-full md:w-52 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none text-gray-600 "
          >
            <option value="all">{isTH ? 'ทั้งหมด' : 'すべてのタグ'}</option>
            {uniqueTagNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag color */}
        <div className="flex flex-col">
          <span className="text-lg text-gray-900 mb-1 font-bold">
            {isTH ? 'สีแท็ก' : 'タグの色'}
          </span>
          <select
            value={tagColorFilter}
            onChange={(e) => onTagColorChange(e.target.value)}
            className="w-full md:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none text-gray-600 "
          >
            <option value="all">{isTH ? 'ทั้งหมด' : 'すべての色'}</option>
            {uniqueTagColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;