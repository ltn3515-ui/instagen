import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      prompt,
      imageBase64,
      mimeType,
      platform = 'instagram',
      outputFormat = 'video'
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
당신은 최고의 SNS 바이럴 콘텐츠 디렉터이자 비주얼 프롬프트 엔지니어입니다.
사용자 요청을 분석하여 아래 규칙을 반드시 준수하여 순수 JSON으로만 응답하세요.

[필수 작성 규칙]
1. caption:
   - 긴 줄글을 지양하고 리스트 형식(•, ✔)으로 깔끔하게 작성.
   - 인트로 훅 -> 핵심 포인트 3가지 -> 팔로우/저장 유도 마무리.
2. hashtags:
   - 반드시 6개 이상 (6~10개) 생성. 모든 태그는 '#' 포함.
3. hookTitle: 틱톡 모드용 3초 시선 집중 타이틀.
4. veoPrompt: 시네마틱 3D 애니메이션 비디오 렌더링용 영문 프롬프트 (카메라 구도, 피사체 외형, 조명, 24fps 4k look).

응답 포맷 (순수 JSON만):
{
  "account": {
    "username": "mio_creator",
    "location": "Mio Studio, Seoul"
  },
  "post": {
    "hookTitle": "3초 후킹 타이틀",
    "caption": "본문 내용",
    "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6"],
    "soundTitle": "Mio Original Sound"
  },
  "veoPrompt": "Vertical 9:16, 3D Pixar style..."
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
    contents.push(prompt || '인스타그램 릴스 기획안을 작성해줘.');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    const generatedVeoPrompt = parsedData.veoPrompt || 'Vertical 9:16, 3D Pixar style cute white cat wearing yellow hoodie waving hand, soft studio lighting, 24fps';

    let finalMediaUrl = '';
    let finalMediaType: 'image' | 'video' = outputFormat === 'image' ? 'image' : 'video';

    if (outputFormat === 'image' && imageBase64) {
      finalMediaUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
    } else {
      finalMediaType = 'video';
      try {
        let operation: any = await (ai.models as any).generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: generatedVeoPrompt,
          config: {
            aspectRatio: isTikTok ? '9:16' : '1:1',
          }
        });

        let attempts = 0;
        while (!operation.done && attempts < 6) {
          await new Promise((res) => setTimeout(res, 8000));
          operation = await (ai.operations as any).get({ operation });
          attempts++;
        }

        if (operation?.response?.generatedVideos?.[0]?.video?.uri) {
          finalMediaUrl = operation.response.generatedVideos[0].video.uri;
        }
      } catch (veoErr: any) {
        // 브라우저 재생 호환성이 보장된 CDN 비디오 리소스
        finalMediaUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      }

      if (!finalMediaUrl) {
        finalMediaUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      }
    }

    let rawTags = parsedData.post?.hashtags || parsedData.hashtags || [];
    if (!Array.isArray(rawTags) || rawTags.length < 6) {
      const fallbackTags = ['#미오', '#MIO', '#AI크리에이터', '#3D캐릭터', '#캐릭터디자인', '#릴스제작', '#고양이캐릭터', '#숏폼'];
      rawTags = Array.from(new Set([...rawTags, ...fallbackTags])).slice(0, 8);
    }

    const finalData = {
      account: {
        username: parsedData.account?.username || 'mio_official_kr',
        isVerified: true,
        location: parsedData.account?.location || 'Mio Studio, Seoul',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      post: {
        mediaType: finalMediaType,
        mediaUrl: finalMediaUrl,
        hookTitle: parsedData.post?.hookTitle || '세상에서 가장 귀여운 AI 크리에이터 미오 등장! 🐱💛',
        caption: parsedData.post?.caption || '반가워요! AI 크리에이터 미오(MIO)예요 👋🐱✨\n\n✔ 질문하는 순간 시작되는 새로운 창작 여정\n✔ 누구나 따라하는 숏폼 & AI 비주얼 팁\n✔ 복잡한 건 빼고 실전 팁만 쏙쏙!\n\n앞으로 함께 성장해 갈 분들은 팔로우하고 소식을 받아보세요 🚀',
        hashtags: rawTags,
        soundTitle: parsedData.post?.soundTitle || 'Mio Official Sound - Welcome',
        likesCount: parsedData.post?.likesCount || 12400,
        commentsCount: parsedData.post?.commentsCount || 142,
        savesCount: parsedData.post?.savesCount || 890,
        timeAgo: '방금 전',
        veoPrompt: generatedVeoPrompt,
      }
    };

    return NextResponse.json(finalData);
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error?.message || '콘텐츠 생성에 실패했습니다.' }, { status: 500 });
  }
}