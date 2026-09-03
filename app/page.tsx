'use client';

import React, { useState } from 'react';
import { Sparkles, Upload, Video, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import InstagramCard, { FeedPayload } from '@/components/InstagramCard';
import CalendarModal from '@/components/CalendarModal';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 기본 프리뷰 데이터
  const [feedData, setFeedData] = useState<FeedPayload>({
    account: {
      username: 'mio_creator',
      isVerified: true,
      location: 'Seoul, Korea',
    },
    post: {
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      likesCount: 1240,
      caption: '반가워요! 함께 만들어가는 새로운 AI 여정 👋✨\n\n• 시선을 사로잡는 나만의 캐릭터 콘텐츠\n• 누구나 따라하기 쉬운 숏폼 & 피드 팁\n• 매일 유익하고 재미있는 꿀팁 대방출!\n\n저장해두고 필요할 때마다 꺼내보세요 📌',
      hashtags: ['#인스타릴스', '#미오', '#AI크리에이터', '#숏폼제작', '#캐릭터디자인', '#크리에이터팁', '#바이럴콘텐츠'],
    }
  });

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? 'video' : 'image');

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Base64 변환 유틸
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 생성 핸들러
  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let imageBase64 = undefined;
      let mimeType = undefined;

      if (selectedFile && mediaType === 'image') {
        imageBase64 = await fileToBase64(selectedFile);
        mimeType = selectedFile.type;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || '첨부된 미디어에 어울리는 최적의 SNS 포스팅을 작성해줘.',
          imageBase64,
          mimeType,
          platform,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || '생성에 실패했습니다.');
      }

      // 핵심: 사용자가 올린 프리뷰 미디어(사진/영상)를 결과 피드에 그대로 즉시 연결
      setFeedData({
        account: result.account || feedData.account,
        post: {
          ...result.post,
          mediaType: mediaType,
          mediaUrl: previewUrl || result.post.mediaUrl || feedData.post.mediaUrl,
        }
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center py-10 px-4 md:px-8 font-sans">

      {/* 헤더 타이틀 */}
      <div className="text-center max-w-xl mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.6 Flash 기반 SNS 자동화</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
          InstaGen Studio
        </h1>
        <p className="text-xs md:text-sm text-zinc-400">
          사진이나 동영상을 올리면 AI가 바이럴 캡션과 해시태그를 1초 만에 완성합니다.
        </p>
      </div>

      {/* 메인 작업 영역 (좌측 입력 패널 + 우측 피드 뷰어) */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* 좌측: 입력 컨트롤러 */}
        <div className="lg:col-span-6 bg-zinc-800/80 border border-zinc-700/60 rounded-3xl p-6 shadow-xl space-y-5 backdrop-blur-md">

          {/* 플랫폼 선택 토글 */}
          <div>
            <label className="text-xs font-bold text-zinc-300 mb-2 block">게시 플랫폼</label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-700/50">
              <button
                type="button"
                onClick={() => setPlatform('instagram')}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${platform === 'instagram'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <span>인스타그램 피드/릴스</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform('tiktok')}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${platform === 'tiktok'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <span>틱톡 (TikTok)</span>
              </button>
            </div>
          </div>

          {/* 사진 또는 동영상 파일 업로드 */}
          <div>
            <label className="text-xs font-bold text-zinc-300 mb-2 block">
              참고 사진 / 동영상 첨부
            </label>
            <label className="relative border-2 border-dashed border-zinc-700 hover:border-rose-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-900/30 transition group overflow-hidden">
              <input
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  {mediaType === 'video' ? (
                    <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white">
                    파일 변경하기
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-rose-400 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-300">
                      이미지 또는 비디오(MP4) 클릭하여 업로드
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">JPG, PNG, MP4 지원</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* 주제 / 프롬프트 입력 */}
          <div>
            <label className="text-xs font-bold text-zinc-300 mb-2 block">
              포스팅 주제 / 메시지
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 미오 캐릭터의 첫 릴스 인사말, 3D AI 크리에이터의 팁 소개"
              className="w-full bg-zinc-900/70 border border-zinc-700 rounded-2xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition resize-none"
            />
          </div>

          {/* 에러 메시지 알림 */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGenerate}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gemini 3.6 분석 및 생성 중...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>캡션 & 해시태그 즉시 생성</span>
              </>
            )}
          </button>
        </div>

        {/* 우측: 피드 실시간 미리보기 뷰어 */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <InstagramCard
            data={feedData}
            fallbackImageUrl={previewUrl}
            onAddToCalendar={() => setIsCalendarOpen(true)}
          />
        </div>

      </div>

      {/* 캘린더 모달 */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        caption={feedData.post.caption}
        hashtags={feedData.post.hashtags}
      />

    </main>
  );
}