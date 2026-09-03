'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  BadgeCheck,
  Copy,
  Check,
  Sparkles,
  Film,
  Download,
  ExternalLink,
  CalendarPlus
} from 'lucide-react';

export interface FeedPayload {
  account: {
    username: string;
    isVerified: boolean;
    location: string;
    avatarUrl: string;
  };
  post: {
    mediaType?: 'image' | 'video';
    mediaUrl: string;
    likesCount: number;
    caption: string;
    hashtags: string[];
    timeAgo: string;
    visualPrompt?: string;
    veoPrompt?: string;
  };
}

interface InstagramCardProps {
  data: FeedPayload;
  onAddToCalendar?: () => void;
}

export default function InstagramCard({ data, onAddToCalendar }: InstagramCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(data.post.likesCount);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMotionReels, setIsMotionReels] = useState(true);

  const lastTapRef = useRef<number>(0);
  const isVideo = data.post.mediaType === 'video';

  useEffect(() => {
    setLikes(data.post.likesCount);
    setIsLiked(false);
  }, [data]);

  const handleMediaClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setIsLiked(true);
        setLikes((prev) => prev + 1);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 700);
    }
    lastTapRef.current = now;
  };

  const handleCopyCaption = () => {
    const formatted = `${data.post.caption}\n\n${data.post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[390px] bg-white border border-zinc-200/90 rounded-[28px] shadow-2xl overflow-hidden font-sans select-none">

      {/* 1. 상단 프로필 바 */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600">
            <div className="p-[1.5px] bg-white rounded-full">
              <img
                src={data.account.avatarUrl}
                alt={data.account.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-zinc-900 leading-tight">{data.account.username}</span>
              {data.account.isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              )}
            </div>
            {data.account.location && (
              <span className="text-[10px] text-zinc-500 leading-tight">{data.account.location}</span>
            )}
          </div>
        </div>

        {/* 릴스 모션 토글 */}
        {!isVideo && (
          <button
            onClick={() => setIsMotionReels(!isMotionReels)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${isMotionReels ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-zinc-100 text-zinc-500'
              }`}
            title="이미지에 영상 모션을 입힙니다"
          >
            <Film className="w-3 h-3" />
            <span>{isMotionReels ? '릴스 모션 ON' : '스틸컷'}</span>
          </button>
        )}
      </div>

      {/* 2. 미디어 뷰포트 (1:1) */}
      <div
        className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={handleMediaClick}
      >
        {isVideo ? (
          <video
            src={data.post.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <img
            src={data.post.mediaUrl}
            alt="Generated Visual"
            className={`w-full h-full object-cover pointer-events-none transition-transform ${isMotionReels ? 'animate-[pulse_12s_ease-in-out_infinite] scale-110' : 'scale-100'
              }`}
          />
        )}

        <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-medium text-white/90">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>{isVideo ? 'Veo Video' : 'AI Visual'}</span>
        </div>

        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl opacity-90 animate-ping" />
          </div>
        )}
      </div>

      {/* 3. 하단 액션 & 캡션 */}
      <div className="px-3.5 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => { setIsLiked(!isLiked); setLikes(isLiked ? likes - 1 : likes + 1); }}
              className="active:scale-75 transition-transform cursor-pointer"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-zinc-900 hover:text-zinc-600'}`} />
            </button>
            <button className="active:scale-75 transition-transform cursor-pointer">
              <MessageCircle className="w-6 h-6 text-zinc-900 hover:text-zinc-600 -rotate-90" />
            </button>
            <button className="active:scale-75 transition-transform cursor-pointer">
              <Send className="w-6 h-6 text-zinc-900 hover:text-zinc-600 -rotate-12" />
            </button>
          </div>
          <button onClick={() => setIsSaved(!isSaved)} className="active:scale-75 transition-transform cursor-pointer">
            <Bookmark className={`w-6 h-6 ${isSaved ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-900 hover:text-zinc-600'}`} />
          </button>
        </div>

        <div className="mt-2 text-xs font-bold text-zinc-900">
          좋아요 {likes.toLocaleString()}개
        </div>

        <div className="mt-1.5 text-xs text-zinc-800 leading-relaxed">
          <span className="font-bold text-zinc-900 mr-1.5">{data.account.username}</span>
          <span className="whitespace-pre-line">
            {isExpanded
              ? data.post.caption
              : `${data.post.caption.slice(0, 58)}${data.post.caption.length > 58 ? '...' : ''}`
            }
          </span>
          {data.post.caption.length > 58 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-zinc-400 ml-1 hover:text-zinc-600 cursor-pointer"
            >
              더 보기
            </button>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1 text-xs text-blue-900 font-medium">
          {data.post.hashtags.map((tag, index) => (
            <span key={index} className="hover:underline cursor-pointer">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>

        <div className="mt-2 text-[10px] text-zinc-400 uppercase">
          {data.post.timeAgo}
        </div>
      </div>

      {/* 4. 원클릭 다운로드 & 인스타 바로가기 & 캘린더 추가 & 캡션 복사 툴바 */}
      <div className="px-3.5 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          <a
            href={data.post.mediaUrl}
            download={isVideo ? 'insta_post.mp4' : 'insta_post.jpg'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition cursor-pointer shadow-2xs"
            title="미디어 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>저장</span>
          </a>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-semibold transition cursor-pointer"
            title="인스타그램 열기"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>인스타</span>
          </a>

          {onAddToCalendar && (
            <button
              onClick={onAddToCalendar}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
              title="콘텐츠 캘린더에 일정 추가"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>캘린더</span>
            </button>
          )}
        </div>

        <button
          onClick={handleCopyCaption}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 text-xs font-bold text-white hover:opacity-95 transition shadow-xs cursor-pointer"
        >
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? '복사됨' : '캡션 복사'}</span>
        </button>
      </div>

    </div>
  );
}