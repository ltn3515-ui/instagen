'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Sparkles,
  Copy,
  Check,
  Calendar
} from 'lucide-react';

export interface FeedPayload {
  account: {
    username: string;
    isVerified?: boolean;
    location?: string;
    avatarUrl?: string;
  };
  post: {
    mediaType?: 'image' | 'video';
    mediaUrl: string;
    likesCount?: number;
    caption: string;
    hashtags: string[];
    timeAgo?: string;
    veoPrompt?: string;
  };
}

interface Props {
  data: FeedPayload;
  fallbackImageUrl?: string | null;
  onAddToCalendar?: () => void;
}

export default function InstagramCard({ data, fallbackImageUrl, onAddToCalendar }: Props) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 백업/포스터로 표시할 이미지 주소
  const displayBackupImage = fallbackImageUrl ||
    (data.post.mediaUrl?.startsWith('data:image') ? data.post.mediaUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');

  const isPureImage = data.post.mediaType === 'image' || data.post.mediaUrl?.startsWith('data:image');

  // 미디어 주소 변경 시 자동 재생 재시도
  useEffect(() => {
    setVideoError(false);
    setIsVideoLoaded(false);
    setIsPlaying(true);

    if (videoRef.current && !isPureImage) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [data.post.mediaUrl, isPureImage]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleCopyCaption = () => {
    const fullText = `${data.post.caption}\n\n${data.post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[390px] bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-xl flex flex-col font-sans">

      {/* 1. 상단 프로필 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 p-[2px]">
            <img
              src={displayBackupImage}
              alt={data.account.username}
              className="w-full h-full rounded-full object-cover border border-white"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-zinc-900">{data.account.username}</span>
              {data.account.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]">✓</span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400">{data.account.location || 'Mio Studio, Seoul'}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
          릴스 모션 ON
        </span>
      </div>

      {/* 2. 미디어 뷰포트 (비디오 / 이미지) */}
      <div className="relative aspect-[9/16] bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer select-none" onClick={togglePlay}>
        {isPureImage || videoError ? (
          <img
            src={displayBackupImage}
            alt="Content Visual"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={data.post.mediaUrl}
            poster={displayBackupImage}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onLoadedData={() => {
              setIsVideoLoaded(true);
              if (videoRef.current) {
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
              }
            }}
            onError={() => {
              console.warn("비디오 스트림 재생 오류: 백업 이미지로 전환합니다.");
              setVideoError(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />
        )}

        {/* 뱃지 */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{isPureImage || videoError ? 'AI Visual' : 'Veo Video'}</span>
        </div>

        {/* 음소거 토글 버튼 */}
        {!isPureImage && !videoError && (
          <button
            onClick={toggleMute}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:scale-105 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* 정지 오버레이 아이콘 (동영상이 로드된 후 실제로 멈춰 있을 때만 노출) */}
        {!isPureImage && !isPlaying && isVideoLoaded && !videoError && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-zinc-900 shadow-lg">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* 3. 소셜 액션 바 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-zinc-800">
            <button onClick={() => setIsLiked(!isLiked)} className="transition hover:opacity-70">
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button className="transition hover:opacity-70">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="transition hover:opacity-70">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setIsSaved(!isSaved)} className="transition hover:opacity-70 text-zinc-800">
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-zinc-900 text-zinc-900' : ''}`} />
          </button>
        </div>

        <p className="text-xs font-bold text-zinc-900 mt-2.5">
          좋아요 {(data.post.likesCount || 12400) + (isLiked ? 1 : 0)}개
        </p>

        {/* 4. 캡션 및 해시태그 */}
        <div className="mt-2 space-y-1.5 text-xs text-zinc-800 leading-relaxed">
          <p className="whitespace-pre-line">
            <span className="font-bold text-zinc-950 mr-1.5">{data.account.username}</span>
            {data.post.caption}
          </p>
          <div className="flex flex-wrap gap-1 text-blue-600 font-medium text-[11px] pt-1">
            {data.post.hashtags.map((tag, idx) => (
              <span key={idx} className="hover:underline cursor-pointer">{tag}</span>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-zinc-400 uppercase mt-2">방금 전</p>
      </div>

      {/* 5. 하단 액션 툴바 */}
      <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
        {onAddToCalendar && (
          <button
            onClick={onAddToCalendar}
            className="flex-1 py-2 px-3 rounded-xl bg-white border border-zinc-200 text-[11px] font-bold text-zinc-700 hover:border-rose-300 hover:text-rose-600 flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>캘린더 등록</span>
          </button>
        )}
        <button
          onClick={handleCopyCaption}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-[11px] font-bold text-white hover:opacity-90 flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '복사 완료' : '캡션 복사'}</span>
        </button>
      </div>

    </div>
  );
}