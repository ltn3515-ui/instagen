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
  Copy,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';

export interface FeedPayload {
  account: {
    username: string;
    isVerified?: boolean;
    location?: string;
  };
  post: {
    mediaType?: 'image' | 'video';
    mediaUrl: string;
    likesCount?: number;
    caption: string;
    hashtags: string[];
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // 미디어 주소 및 타입 판별
  const mediaUrl = data.post.mediaUrl || fallbackImageUrl || '';
  const isVideo = data.post.mediaType === 'video' || mediaUrl.includes('video/') || mediaUrl.endsWith('.mp4');

  useEffect(() => {
    setIsPlaying(true);
    if (videoRef.current && isVideo) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [mediaUrl, isVideo]);

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

  const handleCopy = () => {
    const fullText = `${data.post.caption}\n\n${data.post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[390px] bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-xl flex flex-col font-sans">

      {/* 1. 상단 프로필 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 p-[2px]">
            <img
              src={fallbackImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
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
            <p className="text-[10px] text-zinc-400">{data.account.location || 'Seoul, Korea'}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> AI 생성 완료
        </span>
      </div>

      {/* 2. 사용자가 올린 미디어 (동영상 / 사진 자동 전환) */}
      <div className="relative aspect-[9/16] bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer select-none" onClick={isVideo ? togglePlay : undefined}>
        {isVideo ? (
          <video
            ref={videoRef}
            key={mediaUrl}
            src={mediaUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={mediaUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'}
            alt="Uploaded Content"
            className="w-full h-full object-cover"
          />
        )}

        {/* 동영상 전용 컨트롤 */}
        {isVideo && (
          <>
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:scale-105 transition z-10"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {!isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-zinc-900 shadow-lg">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. 소셜 인터랙션 */}
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
          좋아요 {(data.post.likesCount || 1240) + (isLiked ? 1 : 0)}개
        </p>

        {/* 4. 생성된 캡션 및 해시태그 */}
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

      {/* 5. 복사 및 캘린더 등록 액션 툴바 */}
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
          onClick={handleCopy}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-[11px] font-bold text-white hover:opacity-90 flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '복사 완료' : '캡션 복사'}</span>
        </button>
      </div>

    </div>
  );
}