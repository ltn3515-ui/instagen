'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Heart,
    MessageSquare,
    Bookmark,
    Share2,
    Music2,
    Plus,
    Check,
    Copy,
    Sparkles,
    Volume2,
    VolumeX,
    Play,
    Download,
    ExternalLink,
    CalendarPlus
} from 'lucide-react';

export interface TikTokPayload {
    account: {
        username: string;
        avatarUrl: string;
    };
    post: {
        mediaType?: 'image' | 'video';
        mediaUrl: string;
        hookTitle: string;
        caption: string;
        hashtags: string[];
        soundTitle: string;
        likesCount: number;
        commentsCount: number;
        savesCount: number;
        veoPrompt?: string;
    };
}

interface TikTokCardProps {
    data: TikTokPayload;
    onAddToCalendar?: () => void;
}

export default function TikTokCard({ data, onAddToCalendar }: TikTokCardProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(data.post.likesCount);
    const [isSaved, setIsSaved] = useState(false);
    const [isFollowed, setIsFollowed] = useState(false);
    const [showHeartPop, setShowHeartPop] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [showPlayIcon, setShowPlayIcon] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const lastTapRef = useRef<number>(0);
    const isVideo = data.post.mediaType === 'video';

    useEffect(() => {
        setLikes(data.post.likesCount);
        setIsLiked(false);
        setIsPlaying(true);
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
        } else {
            if (isVideo && videoRef.current) {
                if (videoRef.current.paused) {
                    videoRef.current.play();
                    setIsPlaying(true);
                } else {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
                setShowPlayIcon(true);
                setTimeout(() => setShowPlayIcon(false), 600);
            }
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
        <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-zinc-800 select-none flex flex-col justify-between">

            {/* 1. 배경 미디어 */}
            <div
                className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center overflow-hidden"
                onClick={handleMediaClick}
            >
                {isVideo ? (
                    <video
                        ref={videoRef}
                        src={data.post.mediaUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={data.post.mediaUrl}
                        alt="TikTok Visual"
                        className="w-full h-full object-cover animate-[pulse_10s_ease-in-out_infinite] scale-105"
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

                {/* 볼드 후킹 자막 */}
                {data.post.hookTitle && (
                    <div className="absolute top-[28%] px-6 text-center z-10 pointer-events-none animate-in fade-in zoom-in-90 duration-300">
                        <span className="inline-block px-4 py-2 bg-yellow-400 text-zinc-950 font-black text-base sm:text-lg leading-tight tracking-tight rounded-xl shadow-2xl border-2 border-black rotate-[-1.5deg]">
                            {data.post.hookTitle}
                        </span>
                    </div>
                )}

                {showHeartPop && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-ping" />
                    </div>
                )}

                {showPlayIcon && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-sm">
                            {isPlaying ? <Play className="w-8 h-8 fill-white" /> : <div className="w-8 h-8 flex items-center justify-center gap-1"><div className="w-2.5 h-6 bg-white rounded-xs" /><div className="w-2.5 h-6 bg-white rounded-xs" /></div>}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. 상단 헤더 */}
            <div className="relative z-20 flex items-center justify-between px-5 pt-5 text-white/90">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-mono text-zinc-300">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>TikTok Mode</span>
                </div>

                <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="text-white/60 hover:text-white cursor-pointer transition">팔로잉</span>
                    <span className="text-white border-b-2 border-white pb-0.5 cursor-pointer">추천</span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                    }}
                    className="p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white cursor-pointer"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            </div>

            {/* 3. 하단 컨텐츠 & 우측 액션 바 */}
            <div className="relative z-20 flex items-end justify-between p-4 pb-3 gap-3">
                <div className="flex-1 text-white space-y-1.5">
                    <div className="font-bold text-sm text-white drop-shadow-md">
                        @{data.account.username}
                    </div>

                    <p className="text-xs text-white/90 leading-snug drop-shadow-md line-clamp-3">
                        {data.post.caption}
                    </p>

                    <div className="flex flex-wrap gap-1.5 text-xs font-bold text-cyan-300 drop-shadow-sm">
                        {data.post.hashtags.map((tag, idx) => (
                            <span key={idx}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-white/80 pt-0.5">
                        <Music2 className="w-3.5 h-3.5 animate-bounce shrink-0" />
                        <div className="overflow-hidden w-40">
                            <div className="truncate font-mono">
                                {data.post.soundTitle || '오리지널 사운드 - 바이럴 믹스'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3.5 text-white">
                    <div className="relative mb-1">
                        <img
                            src={data.account.avatarUrl}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full border-2 border-white object-cover"
                        />
                        {!isFollowed ? (
                            <button
                                onClick={() => setIsFollowed(true)}
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center cursor-pointer shadow-md"
                            >
                                <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                        ) : (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => { setIsLiked(!isLiked); setLikes(isLiked ? likes - 1 : likes + 1); }}
                        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-75 transition"
                    >
                        <Heart className={`w-7 h-7 drop-shadow-md transition ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                        <span className="text-[10px] font-bold">{(likes / 1000).toFixed(1)}K</span>
                    </button>

                    <button className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-75 transition">
                        <MessageSquare className="w-7 h-7 text-white fill-white/20 drop-shadow-md" />
                        <span className="text-[10px] font-bold">{data.post.commentsCount}</span>
                    </button>

                    <button
                        onClick={() => setIsSaved(!isSaved)}
                        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-75 transition"
                    >
                        <Bookmark className={`w-7 h-7 drop-shadow-md transition ${isSaved ? 'text-amber-400 fill-amber-400' : 'text-white'}`} />
                        <span className="text-[10px] font-bold">{data.post.savesCount}</span>
                    </button>

                    <button className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-75 transition">
                        <Share2 className="w-7 h-7 text-white drop-shadow-md" />
                        <span className="text-[10px] font-bold">공유</span>
                    </button>

                    <div className="pt-0.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-zinc-700 p-1 flex items-center justify-center animate-[spin_4s_linear_infinite] shadow-lg">
                            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. 최하단 원클릭 툴바 (저장, 틱톡, 캘린더, 캡션 복사) */}
            <div className="relative z-20 px-3 py-2.5 bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-md flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                    <a
                        href={data.post.mediaUrl}
                        download={isVideo ? 'tiktok_video.mp4' : 'tiktok_video.jpg'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
                        title="영상 저장"
                    >
                        <Download className="w-3 h-3" />
                        <span>저장</span>
                    </a>

                    <a
                        href="https://www.tiktok.com/upload"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
                        title="틱톡 업로드 바로가기"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <span>틱톡</span>
                    </a>

                    {onAddToCalendar && (
                        <button
                            onClick={onAddToCalendar}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                            title="콘텐츠 캘린더에 일정 추가"
                        >
                            <CalendarPlus className="w-3 h-3" />
                            <span>캘린더</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={handleCopyCaption}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition shadow-xs cursor-pointer"
                >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? '복사됨' : '복사'}</span>
                </button>
            </div>

        </div>
    );
}