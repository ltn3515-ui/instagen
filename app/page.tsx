'use client';

import React, { useState, useRef, useEffect } from 'react';
import InstagramCard, { FeedPayload } from '@/components/InstagramCard';
import TikTokCard, { TikTokPayload } from '@/components/TikTokCard';
import ContentCalendar, { CalendarItem } from '@/components/ContentCalendar';
import {
  Sparkles,
  RefreshCw,
  Send,
  Video,
  Image as ImageIcon,
  X,
  Clapperboard,
  Code2,
  Calendar
} from 'lucide-react';

const INITIAL_INSTA: FeedPayload = {
  account: {
    username: 'mio_creator',
    isVerified: true,
    location: 'Mio Studio, Seoul',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  post: {
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-cup-with-latte-art-placed-on-a-table-41551-large.mp4',
    likesCount: 3420,
    caption: '반가워요! AI 크리에이터 미오(MIO)의 첫 기록 🐱✨\n\n• 상상 속 아이디어를 현실로 구현하는 창작 여정\n• 초보자도 쉽게 따라하는 실전 AI 숏폼 꿀팁\n• 비효율은 빼고 속도는 높이는 크리에이티브 워크플로우\n\n함께 성장할 준비가 되셨다면 지금 팔로우해 보세요 🚀',
    hashtags: ['#미오', '#MIO', '#AI크리에이터', '#3D캐릭터', '#캐릭터디자인', '#릴스제작', '#고양이캐릭터', '#크리에이터일상'],
    timeAgo: '방금 전',
  }
};

const INITIAL_TIKTOK: TikTokPayload = {
  account: {
    username: 'mio_official',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  post: {
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-cup-with-latte-art-placed-on-a-table-41551-large.mp4',
    hookTitle: '질문하는 순간, 새로운 세상이 열려! 💡',
    caption: 'AI 크리에이터 미오(MIO) 등장! 🐱💛\n\n✔ 3초 만에 시선 끄는 숏폼 기획\n✔ 아이디어 스케치부터 영상 렌더링까지\n✔ 매일 업데이트되는 크리에이터 치트키\n\n저장해두고 다음 꿀팁도 받아보세요!',
    hashtags: ['#fyp', '#추천', '#미오', '#AI크리에이터', '#3D캐릭터', '#숏폼제작', '#바이럴'],
    soundTitle: '오리지널 사운드 - Mio Theme Song',
    likesCount: 52400,
    commentsCount: 428,
    savesCount: 3890,
  }
};

export default function Home() {
  const [currentView, setCurrentView] = useState<'studio' | 'calendar'>('studio');
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');

  // 생성 결과물 형태 선택 (비디오 vs 원본 사진 유지)
  const [outputFormat, setOutputFormat] = useState<'video' | 'image'>('video');

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastVeoPrompt, setLastVeoPrompt] = useState<string | null>(null);

  const [instaData, setInstaData] = useState<FeedPayload>(INITIAL_INSTA);
  const [tiktokData, setTiktokData] = useState<TikTokPayload>(INITIAL_TIKTOK);

  // 캘린더 상태 관리
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달 입력값
  const [modalDate, setModalDate] = useState('2026-09-04');
  const [modalTime, setModalTime] = useState('18:30');
  const [modalPillar, setModalPillar] = useState<CalendarItem['pillar']>('정보/가치제공');

  // 미디어 첨부 상태
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로컬 스토리지 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('socialgen_calendar');
    if (saved) {
      try {
        setCalendarItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToLocalStorage = (items: CalendarItem[]) => {
    setCalendarItems(items);
    localStorage.setItem('socialgen_calendar', JSON.stringify(items));
  };

  const handleProcessFile = (file: File) => {
    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');
    if (!isVid && !isImg) {
      alert('동영상 또는 이미지 파일만 지원됩니다.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);
    setMediaType(isVid ? 'video' : 'image');

    const reader = new FileReader();
    reader.onloadend = () => {
      const full = reader.result as string;
      setImageBase64(full.split(',')[1]);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async (targetPrompt?: string) => {
    const textToSubmit = targetPrompt !== undefined ? targetPrompt : prompt;
    if (!textToSubmit.trim() && !imageBase64 && !mediaPreviewUrl) {
      alert('아이디어를 입력하거나 미디어를 첨부해 주세요.');
      return;
    }
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
          imageBase64,
          mimeType: imageMimeType,
          platform,
          outputFormat // 👈 비디오 또는 사진 선택값 전달
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || '생성에 실패했습니다.');
        return;
      }

      setLastVeoPrompt(data.post.veoPrompt || null);

      if (platform === 'instagram') {
        setInstaData(data);
      } else {
        setTiktokData(data);
      }
    } catch (err: any) {
      alert('서버 에러: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCalendar = () => {
    const isInsta = platform === 'instagram';
    const targetPost = isInsta ? instaData.post : tiktokData.post;

    const newItem: CalendarItem = {
      id: `cal_${Date.now()}`,
      platform,
      date: modalDate,
      time: modalTime,
      pillar: modalPillar,
      status: '제작완료',
      caption: targetPost.caption,
      hashtags: targetPost.hashtags,
      mediaUrl: targetPost.mediaUrl,
      mediaType: targetPost.mediaType || 'video',
      hookTitle: !isInsta ? (tiktokData.post as any).hookTitle : undefined,
      veoPrompt: lastVeoPrompt || undefined,
    };

    const updated = [newItem, ...calendarItems];
    saveToLocalStorage(updated);
    setIsModalOpen(false);
    alert('캘린더에 성공적으로 등록되었습니다! 상단 [콘텐츠 캘린더] 탭에서 확인해 보세요.');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased selection:bg-rose-500 selection:text-white">

      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
              <Clapperboard className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight">SocialGen</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              AI Engine
            </span>
          </div>

          {/* 중앙 모드 전환 탭 */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 shadow-2xs">
            <button
              onClick={() => setCurrentView('studio')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${currentView === 'studio' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
            >
              🎨 제작 스튜디오
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${currentView === 'calendar' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>콘텐츠 캘린더 ({calendarItems.length})</span>
            </button>
          </div>

          {/* 우측 플랫폼 스위처 */}
          {currentView === 'studio' ? (
            <div className="flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200">
              <button
                onClick={() => setPlatform('instagram')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${platform === 'instagram' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                  }`}
              >
                📸 Instagram
              </button>
              <button
                onClick={() => setPlatform('tiktok')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${platform === 'tiktok' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-500'
                  }`}
              >
                🎵 TikTok
              </button>
            </div>
          ) : <div className="w-24" />}
        </div>
      </header>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {currentView === 'calendar' ? (
          <ContentCalendar
            items={calendarItems}
            onDeleteItem={(id) => saveToLocalStorage(calendarItems.filter(i => i.id !== id))}
            onUpdateStatus={(id, nextStatus) => {
              const updated = calendarItems.map(i => i.id === id ? { ...i, status: nextStatus } : i);
              saveToLocalStorage(updated);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* 좌측 입력 폼 패널 */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> 미오(MIO) 캐릭터 & 숏폼 자동화
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 leading-tight">
                  자연어 한 줄로 완성하는<br />
                  <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 bg-clip-text text-transparent">
                    {platform === 'instagram' ? '인스타그램 AI 콘텐츠' : '틱톡 바이럴 숏폼'}
                  </span>
                </h1>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                  미오 캐릭터 사진이나 아이디어를 입력하세요. 시각 분석을 통해 가독성 높은 리스트형 본문과 6개 이상의 타깃 해시태그를 자동 생성합니다.
                </p>
              </div>

              {/* 입력 컨트롤 카드 */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-4">

                {/* 미디어 첨부 영역 */}
                {!mediaPreviewUrl ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${isDragging ? 'border-rose-500 bg-rose-50/40' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                      }`}
                  >
                    <p className="text-xs font-bold text-zinc-700">미오 캐릭터 사진 / 동영상 첨부 (선택)</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">첨부 시 시각 요소를 분석해 캐릭터 특징에 맞춘 캡션을 작성합니다</p>
                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])} className="hidden" />
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-md">
                        {mediaType === 'video' ? '동영상' : '이미지'}
                      </span>
                      <span className="text-xs font-bold text-zinc-800 truncate max-w-[200px]">첨부된 미디어 적용 중</span>
                    </div>
                    <button onClick={removeMedia} className="p-1 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-rose-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* ★ 결과물 형태 선택 스위치 (비디오 vs 원본 사진) */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-2.5">
                  <span className="block text-[11px] font-bold text-zinc-500 mb-2 px-1">최종 결과물 형태 선택</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutputFormat('video')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${outputFormat === 'video'
                          ? 'bg-white text-rose-600 shadow-xs border border-rose-200'
                          : 'text-zinc-600 hover:bg-zinc-100'
                        }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>🎬 릴스/숏폼 영상</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputFormat('image')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${outputFormat === 'image'
                          ? 'bg-white text-rose-600 shadow-xs border border-rose-200'
                          : 'text-zinc-600 hover:bg-zinc-100'
                        }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>🖼️ 원본 사진 유지</span>
                    </button>
                  </div>
                </div>

                {/* 자연어 프롬프트 입력창 */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    콘텐츠 기획 아이디어 (자연어로 자유롭게 작성)
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="예: 미오 캐릭터가 정면을 보며 환하게 손 흔들며 첫 론칭 인사를 전하는 귀여운 릴스 만들어줘."
                    rows={3}
                    className="w-full bg-zinc-50/60 border border-zinc-200 rounded-2xl p-3.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-rose-500 transition resize-none leading-relaxed"
                  />
                </div>

                {/* 생성 버튼 */}
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={loading || (!prompt.trim() && !mediaPreviewUrl)}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI 분석 및 콘텐츠 생성 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{outputFormat === 'video' ? 'AI 릴스 비디오 자동 생성' : '카드뉴스 피드 자동 완성'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Veo 프롬프트 미리보기 */}
              {lastVeoPrompt && (
                <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Gemini가 설계한 시네마틱 프롬프트:</span>
                  </div>
                  <p className="text-[11px] font-mono leading-relaxed text-zinc-300 select-all">
                    "{lastVeoPrompt}"
                  </p>
                </div>
              )}

              {/* 미오 전용 퀵 프리셋 버튼 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-500">미오(MIO) 추천 테스트 아이디어</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    '미오 캐릭터가 반갑게 손 흔들며 첫 론칭 인사하는 릴스',
                    '노트북 앞에서 열심히 코딩하다 번뜩 아이디어가 떠오른 미오',
                    '미오 머그컵을 들고 따뜻한 커피 한 잔과 함께 하루를 시작하는 일상'
                  ].map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(idea);
                        handleGenerate(idea);
                      }}
                      className="text-left text-xs px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:border-rose-300 hover:text-rose-600 transition shadow-2xs cursor-pointer"
                    >
                      🐱 {idea}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 우측 스마트 뷰포트 (인스타그램 / 틱톡 목업) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between max-w-[390px] mb-3 px-2">
                <span className="text-xs font-mono text-zinc-400 font-bold uppercase">
                  {platform === 'instagram' ? 'INSTAGRAM REELS' : 'TIKTOK 9:16'}
                </span>
                <span className="text-[11px] text-zinc-400">소리 켜기 & 클릭 일시정지 지원</span>
              </div>

              {platform === 'instagram' ? (
                <InstagramCard data={instaData} onAddToCalendar={() => setIsModalOpen(true)} />
              ) : (
                <TikTokCard data={tiktokData} onAddToCalendar={() => setIsModalOpen(true)} />
              )}
            </div>

          </div>
        )}
      </main>

      {/* 3. 콘텐츠 캘린더 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                콘텐츠 캘린더에 일정 추가
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">발행 날짜</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">발행 시간</label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">콘텐츠 기둥 (Pillar)</label>
                <select
                  value={modalPillar}
                  onChange={(e) => setModalPillar(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-800"
                >
                  <option value="정보/가치제공">정보/가치제공 (70% - 꿀팁/저장 유도)</option>
                  <option value="공감/트렌드">공감/트렌드 (20% - 일상/밈/비하인드)</option>
                  <option value="제품홍보/이벤트">제품홍보/이벤트 (10% - 론칭/할인)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveToCalendar}
                className="flex-1 py-3 rounded-full bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-800 transition cursor-pointer shadow-md"
              >
                캘린더에 등록 완료
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}