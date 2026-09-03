import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      prompt,
      imageBase64,
      mimeType,
      platform = 'instagram'
    } = await req.json();

    if (!prompt && !imageBase64) {
      return NextResponse.json({ error: '주제를 입력하거나 미디어를 첨부해 주세요.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '.env.local에 GEMINI_API_KEY가 등록되어 있지 않습니다.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const isTikTok = platform === 'tiktok';

    const systemInstruction = `
당신은 최고의 SNS 바이럴 마케터이자 콘텐츠 디렉터입니다.
사용자가 제공한 미디어(이미지/영상 프레임)와 주제를 분석하여 소셜 미디어 피드에 최적화된 결과물을 순수 JSON으로만 응답하세요.

[필수 작성 규칙]
1. caption (본문):
   - 장황한 줄글을 피하고, 가독성 높은 리스트 형식(•, ✔)으로 간결하게 작성.
   - 구성: 시선을 사로잡는 첫 줄(Hook) -> 핵심 내용 3가지 리스트 -> 저장/팔로우/댓글 유도 CTA 마무리.
2. hashtags (해시태그):
   - 검색 노출 및 도달률을 위해 **반드시 6개 이상(6~10개)** 생성.
   - 모든 해시태그는 반드시 '#' 기호로 시작할 것.
3. hookTitle: (틱톡 모드일 때 필수) 화면에 띄울 3초 시선 집중 타이틀.
4. promptIdea: 향후 AI 영상/이미지 생성 시 활용할 수 있는 추천 영문 비주얼 프롬프트 1줄.

응답 형식 (반드시 유효한 순수 JSON만 반환):
{
  "account": {
    "username": "mio_creator",
    "location": "Seoul, South Korea"
  },
  "post": {
    "hookTitle": "3초 후킹 타이틀",
    "caption": "본문 내용 (이모지와 리스트 활용)",
    "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7"],
    "soundTitle": "Original Audio - Trend Mix"
  },
  "promptIdea": "A cinematic high quality visual..."
}
    `.trim();

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }
    contents.push(prompt || '첨부된 미디어에 어울리는 최적의 인스타그램 포스팅을 작성해줘.');

    // Gemini 3.6 Flash 호출 (1~2초 내 초고속 응답)
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      parsedData = {};
    }

    // 해시태그 6개 이상 검증 및 보완
    let rawTags = parsedData.post?.hashtags || parsedData.hashtags || [];
    if (!Array.isArray(rawTags) || rawTags.length < 6) {
      const fallbackTags = isTikTok
        ? ['#fyp', '#추천', '#미오', '#AI크리에이터', '#숏폼콘텐츠', '#바이럴', '#릴스추천']
        : ['#인스타릴스', '#미오', '#AI콘텐츠', '#크리에이터', '#캐릭터디자인', '#릴스제작', '#트렌드'];
      rawTags = Array.from(new Set([...rawTags, ...fallbackTags])).slice(0, 8);
    }

    const finalData = {
      account: {
        username: parsedData.account?.username || 'mio_creator',
        isVerified: true,
        location: parsedData.account?.location || 'Seoul, Korea',
      },
      post: {
        hookTitle: parsedData.post?.hookTitle || '주목! 새로운 소식이 찾아왔어요 ✨',
        caption: parsedData.post?.caption || '반가워요! 함께 만들어가는 새로운 여정 👋✨\n\n• 질문하는 순간 시작되는 스마트한 팁\n• 누구나 따라하기 쉬운 실전 노하우\n• 매일 유익한 소식을 전해드려요\n\n저장해두고 필요할 때마다 꺼내보세요 📌',
        hashtags: rawTags,
        soundTitle: parsedData.post?.soundTitle || 'Original Audio',
        likesCount: parsedData.post?.likesCount || 1240,
      },
      promptIdea: parsedData.promptIdea || ''
    };

    return NextResponse.json(finalData);
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error?.message || '콘텐츠 생성에 실패했습니다.' }, { status: 500 });
  }
}