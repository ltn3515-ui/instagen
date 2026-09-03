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
    username: 'mio_official',
    isVerified: true,
    location: 'Mio Studio, Seoul',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  post: {
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    likesCount: 12400,
    caption: '안녕! 난 미오(MIO)야! 👋🐱✨ 드디어 내 공식 채널이 오픈했어!\n\n• 💛 노랑 후드티와 스냅백이 나의 시그니처 룩!\n• 🎬 앞으로 매일 펼쳐질 신나고 따뜻한 3D 일상 스토리\n• 🎁 팔로워만을 위한 소소한 힐링 콘텐츠 대기 중!\n\n✔ 지금 바로 팔로우하고 미오의 첫 번째 절친이 되어줘! 📌 잊지 않게 저장 꾸욱!',
    hashtags: ['#미오', '#MIO', '#3D애니메이션', '#캐릭터디자인', '#귀여운캐릭터', '#힐링콘텐츠', '#픽사스타일', '#인스타그램론칭'],
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
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    hookTitle: '질문하는 순간 새로운 세상이 열려! 💡',
    caption: '호기심 많은 AI 크리에이터 미오 등장! 🐱💛\n\n✔ 3초 만에 시선 끄는 숏폼 기획\n✔ 아이디어 스케치부터 영상 렌더링까지\n✔ 매일 업데이트되는 크리에이터 치트키\n\n저장해두고 다음 꿀팁도 받아보세요!',
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

  const [outputFormat, setOutputFormat] = useState<'video' | 'image'>('video');

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastVeoPrompt, setLastVeoPrompt] = useState<string | null>(null);

  const [instaData, setInstaData] = useState<FeedPayload>(INITIAL_INSTA);
  const [tiktokData, setTiktokData] = useState<TikTokPayload>(INITIAL_TIKTOK);

  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalDate, setModalDate] = useState('2026-09-04');
  const [modalTime, setModalTime] = useState('18:30');
  const [modalPillar, setModalPillar] = useState<CalendarItem['pillar']>('정보/가치제공');

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          outputFormat
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
    alert('캘린더에 성공적으로 등록되었습니다!');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased selection:bg-rose-500 selection:text-white">

      {/* 1. 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
              <Clapperboard className="w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight">SocialGen</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              AI Studio
            </span>
          </div>

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

            {/* 좌측 패널 */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> AI 기반 숏폼 & 피드 자동화 스튜디오
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 leading-tight">
                  자연어 한 줄로 완성하는<br />
                  <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 bg-clip-text text-transparent">
                    {platform === 'instagram' ? '인스타그램 AI 콘텐츠' : '틱톡 바이럴 숏폼'}
                  </span>
                </h1>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                  원하는 아이디어나 참고 미디어를 입력하세요. 시각 분석을 통해 가독성 높은 리스트형 본문과 6개 이상의 타깃 해시태그를 자동 완성합니다.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-4">

                {/* 미디어 첨부 */}
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
                    <p className="text-xs font-bold text-zinc-700">참고 사진 / 동영상 첨부 (선택)</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">이미지나 영상을 분석해 분위기와 피사체에 맞는 캡션을 자동 작성합니다</p>
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

                {/* 포맷 선택 */}
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

                {/* 입력창 */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    콘텐츠 기획 아이디어 (자연어로 자유롭게 작성)
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="예: 첨부된 미오 캐릭터가 정면을 보며 환하게 손 흔들며 인사하는 첫 론칭 릴스 만들어줘."
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

              {/* Veo 프롬프트 */}
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

              {/* 퀵 프리셋 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-500">빠른 추천 아이디어</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    '따뜻한 아포가토 에스프레소 붓는 슬로우 모션 릴스',
                    '비 내리는 네온사인 도쿄 골목길 시네마틱 숏폼',
                    '모래사장 위로 부서지는 에메랄드 파도 ASMR 숏폼'
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
                      ✨ {idea}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 우측 목업 */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between max-w-[390px] mb-3 px-2">
                <span className="text-xs font-mono text-zinc-400 font-bold uppercase">
                  {platform === 'instagram' ? 'INSTAGRAM REELS' : 'TIKTOK 9:16'}
                </span>
                <span className="text-[11px] text-zinc-400">소리 켜기 & 클릭 일시정지 지원</span>
              </div>

              {platform === 'instagram' ? (
                <InstagramCard
                  data={instaData}
                  fallbackImageUrl={mediaPreviewUrl || (imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : null)}
                  onAddToCalendar={() => setIsModalOpen(true)}
                />
              ) : (
                <TikTokCard data={tiktokData} onAddToCalendar={() => setIsModalOpen(true)} />
              )}
            </div>

          </div>
        )}
      </main>

      {/* 3. 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-zinc-200">
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