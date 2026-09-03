'use client';

import React, { useState } from 'react';
import { Calendar, X, Check } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  hashtags: string[];
}

export default function CalendarModal({ isOpen, onClose, caption, hashtags }: CalendarModalProps) {
  const [modalDate, setModalDate] = useState('2026-09-04');
  const [modalTime, setModalTime] = useState('18:30');
  const [modalPillar, setModalPillar] = useState<'정보/가치제공' | '공감/트렌드' | '제품홍보/이벤트'>('정보/가치제공');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const saved = localStorage.getItem('socialgen_calendar');
      const calendarItems = saved ? JSON.parse(saved) : [];

      const newItem = {
        id: `cal_${Date.now()}`,
        platform: 'instagram',
        date: modalDate,
        time: modalTime,
        pillar: modalPillar,
        status: '제작완료',
        caption,
        hashtags,
        mediaUrl: '',
        mediaType: 'image',
      };

      const updated = [newItem, ...calendarItems];
      localStorage.setItem('socialgen_calendar', JSON.stringify(updated));

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-bold flex items-center gap-2 text-zinc-100">
            <Calendar className="w-4 h-4 text-rose-500" />
            콘텐츠 캘린더에 일정 추가
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSaved ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-rose-400">
            <Check className="w-10 h-10 animate-bounce" />
            <p className="text-sm font-bold">캘린더에 성공적으로 등록되었습니다!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">발행 날짜</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">발행 시간</label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">콘텐츠 기둥 (Pillar)</label>
                <select
                  value={modalPillar}
                  onChange={(e) => setModalPillar(e.target.value as any)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs font-bold text-zinc-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="정보/가치제공">정보/가치제공 (70% - 꿀팁/저장 유도)</option>
                  <option value="공감/트렌드">공감/트렌드 (20% - 일상/밈/비하인드)</option>
                  <option value="제품홍보/이벤트">제품홍보/이벤트 (10% - 론칭/할인)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-xs font-bold text-white hover:opacity-90 transition cursor-pointer shadow-md"
              >
                캘린더 등록
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
