'use client';

import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    Trash2,
    Copy,
    Check,
    ExternalLink,
    Film,
    Layers,
    Tag,
    Sparkles
} from 'lucide-react';

export interface CalendarItem {
    id: string;
    platform: 'instagram' | 'tiktok';
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    pillar: '정보/가치제공' | '공감/트렌드' | '제품홍보/이벤트';
    status: '기획중' | '제작완료' | '발행완료';
    caption: string;
    hashtags: string[];
    mediaUrl: string;
    mediaType: 'image' | 'video';
    hookTitle?: string;
    veoPrompt?: string;
}

interface ContentCalendarProps {
    items: CalendarItem[];
    onDeleteItem: (id: string) => void;
    onUpdateStatus: (id: string, nextStatus: CalendarItem['status']) => void;
}

export default function ContentCalendar({ items, onDeleteItem, onUpdateStatus }: ContentCalendarProps) {
    const [filterPillar, setFilterPillar] = useState<string>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (item: CalendarItem) => {
        const text = `${item.caption}\n\n${item.hashtags.join(' ')}`;
        navigator.clipboard.writeText(text);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const filteredItems = items
        .filter((item) => filterPillar === 'all' || item.pillar === filterPillar)
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

    const getPillarBadgeColor = (pillar: CalendarItem['pillar']) => {
        switch (pillar) {
            case '정보/가치제공':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case '공감/트렌드':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case '제품홍보/이벤트':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        }
    };

    const getStatusBadge = (status: CalendarItem['status']) => {
        switch (status) {
            case '발행완료':
                return 'bg-zinc-900 text-white';
            case '제작완료':
                return 'bg-amber-500 text-white';
            default:
                return 'bg-zinc-200 text-zinc-700';
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">

            {/* 캘린더 헤더 컨트롤 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-zinc-200 shadow-2xs">
                <div>
                    <h2 className="text-xl font-black text-zinc-950 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-rose-500" />
                        콘텐츠 발행 스케줄러 ({filteredItems.length}개)
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        황금 비율(70:20:10)에 맞춰 예약된 릴스 및 피드 발행 플랜입니다.
                    </p>
                </div>

                {/* 필터 칩 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {['all', '정보/가치제공', '공감/트렌드', '제품홍보/이벤트'].map((pil) => (
                        <button
                            key={pil}
                            onClick={() => setFilterPillar(pil)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${filterPillar === pil
                                    ? 'bg-zinc-950 text-white shadow-2xs'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                }`}
                        >
                            {pil === 'all' ? '전체 보기' : pil}
                        </button>
                    ))}
                </div>
            </div>

            {/* 캘린더 아이템 그리드 */}
            {filteredItems.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-zinc-200 p-16 text-center">
                    <CalendarIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-zinc-700">등록된 콘텐츠 일정이 없습니다.</p>
                    <p className="text-xs text-zinc-400 mt-1">
                        스튜디오 탭에서 릴스나 피드를 생성한 후 [캘린더에 추가] 버튼을 눌러보세요.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                        >
                            {/* 상단 미디어 썸네일 & 뱃지 */}
                            <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                                {item.mediaType === 'video' ? (
                                    <video src={item.mediaUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                                ) : (
                                    <img src={item.mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                )}

                                {/* 플랫폼 & 포맷 */}
                                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase flex items-center gap-1">
                                        {item.platform === 'instagram' ? '📸 Instagram' : '🎵 TikTok'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* 후킹 자막 칩 */}
                                {item.hookTitle && (
                                    <div className="absolute bottom-2.5 left-3 right-3 truncate">
                                        <span className="inline-block px-2 py-1 bg-yellow-400 text-black text-[11px] font-black rounded-lg shadow-sm truncate max-w-full">
                                            {item.hookTitle}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 본문 정보 */}
                            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                <div>
                                    {/* 날짜/시간 & 기둥 뱃지 */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                            <span>{item.date}</span>
                                            <span className="text-zinc-400 font-normal">|</span>
                                            <span>{item.time}</span>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPillarBadgeColor(item.pillar)}`}>
                                            {item.pillar}
                                        </span>
                                    </div>

                                    {/* 캡션 본문 요약 */}
                                    <p className="text-xs text-zinc-700 line-clamp-3 leading-relaxed">
                                        {item.caption}
                                    </p>

                                    {/* 해시태그 */}
                                    <div className="flex flex-wrap gap-1 mt-2 text-[11px] text-blue-700 font-medium">
                                        {item.hashtags.slice(0, 3).map((t, idx) => (
                                            <span key={idx}>{t.startsWith('#') ? t : `#${t}`}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Veo 프롬프트 미리보기 (있을 경우) */}
                                {item.veoPrompt && (
                                    <div className="mt-2 p-2 rounded-xl bg-zinc-50 border border-zinc-100 text-[10px] text-zinc-500 truncate font-mono">
                                        🎬 Veo: {item.veoPrompt}
                                    </div>
                                )}
                            </div>

                            {/* 하단 제어 액션 바 */}
                            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                {/* 상태 토글 버튼 */}
                                <button
                                    onClick={() => {
                                        const next = item.status === '기획중' ? '제작완료' : item.status === '제작완료' ? '발행완료' : '기획중';
                                        onUpdateStatus(item.id, next);
                                    }}
                                    className="text-[11px] font-bold text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
                                >
                                    상태 변경 ↺
                                </button>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleCopy(item)}
                                        className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition cursor-pointer"
                                        title="캡션 복사"
                                    >
                                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => onDeleteItem(item.id)}
                                        className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                                        title="일정 삭제"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}