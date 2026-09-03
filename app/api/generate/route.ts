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
      outputFormat = 'video' // 'video' | 'image' (프론트엔드 선택값)
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

    // 1. Gemini 지시문: 시각 분석 + 리스트형 캡션 + 6개 이상 타깃 해시태그 + Veo 프롬프트
    const systemInstruction = `
당신은 최고의 SNS 바이럴 콘텐츠 디렉터이자 비주얼 프롬프트 엔지니어입니다.
사용자 요청(자연어 기획문 또는 첨부된 이미지/캐릭터)을 분석하여 아래 규칙을 반드시 준수하여 순수 JSON으로만 응답하세요.

[필수 작성 규칙]
1. caption (본문):
   - 긴 줄글을 지양하고, 읽기 편한 **리스트 형식(체크리스트, 글머리 기호 •, ✔)**으로 깔끔하게 작성하세요.
   - 구성: 감성 인트로 훅 한 줄 -> 핵심 포인트 3가지 리스트 -> 저장/팔로우 유도 마무리 한 줄.
2. hashtags (해시태그):
   - **반드시 6개 이상 (6~10개)**을 생성하세요.
   - 일반 태그(#릴스, #일상 등)에만 그치지 말고, 캐릭터명, 사물, 장소, 타깃 관심사 등 핵심 키워드를 정밀하게 매핑하세요.
   - 모든 태그는 '#' 기호로 시작해야 합니다.
3. hookTitle: (틱톡 모드일 때 필수) 화면 중앙 3초 시선 집중용 텍스트.
4. veoPrompt: 시네마틱 3D 애니메이션/비디오 렌더링용 영문 프롬프트 (카메라 구도, 캐릭터 특징, 조명, 24fps 4k look, 25단어 내외).

응답 포맷 (순수 JSON만 출력):
{
  "account": {
    "username": "영문 계정명",
    "location": "장소 또는 스튜디오명"
  },
  "post": {
    "hookTitle": "3초 후킹 타이틀",
    "caption": "인트로\\n\\n✔ 포인트 1: ...\\n✔ 포인트 2: ...\\n✔ 포인트 3: ...\\n\\n마무리 문구",
    "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"],
    "soundTitle": "추천 사운드명"
  },
  "veoPrompt": "Vertical 9:16 cinematic 3D animation prompt..."
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
    contents.push(prompt || (isTikTok ? '이 미디어에 어울리는 바이럴 틱톡 숏폼을 기획해줘.' : '이 미디어에 어울리는 감성 인스타 릴스를 기획해줘.'));

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

    const generatedVeoPrompt = parsedData.veoPrompt || 'Vertical 9:16, cute 3D character animation, Pixar Disney style, soft studio lighting, 24fps film look';

    // 2. 미디어 결과물 처리: 사용자가 선택한 outputFormat('video' vs 'image')에 따른 분기
    let finalMediaUrl = '';
    let finalMediaType: 'image' | 'video' = outputFormat === 'image' ? 'image' : 'video';

    if (outputFormat === 'image' && imageBase64) {
      // 사용자가 [🖼️ 원본 사진 유지]를 선택한 경우: 첨부한 원본 사진 사용
      finalMediaUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
    } else {
      // 사용자가 [🎬 릴스/숏폼 영상]을 선택했거나 이미지가 없는 경우: Veo 비디오 생성 시도
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
        // Veo 호출 지연/실패 시 안정적인 프리뷰 비디오 자동 제공
        const sampleVideos = [
          'https://assets.mixkit.co/videos/preview/mixkit-coffee-cup-with-latte-art-placed-on-a-table-41551-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-cyclist-riding-down-a-hill-on-a-sunny-day-41619-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-laptop-42848-large.mp4'
        ];
        finalMediaUrl = sampleVideos[0];
      }
    }

    // 3. 해시태그 6개 이상 보장 처리
    let rawTags = parsedData.post?.hashtags || parsedData.hashtags || [];
    if (!Array.isArray(rawTags) || rawTags.length < 6) {
      const fallbackTags = isTikTok
        ? ['#fyp', '#추천', '#미오', '#AI크리에이터', '#3D캐릭터', '#숏폼제작', '#바이럴']
        : ['#미오', '#MIO', '#AI크리에이터', '#3D캐릭터', '#캐릭터디자인', '#릴스제작', '#감성릴스', '#크리에이터일상'];
      rawTags = Array.from(new Set([...rawTags, ...fallbackTags])).slice(0, 8);
    }

    // 4. 최종 클라이언트 응답 데이터 패키징
    const finalData = {
      account: {
        username: parsedData.account?.username || 'mio_creator',
        isVerified: parsedData.account?.isVerified ?? true,
        location: parsedData.account?.location || 'Mio Studio, Seoul',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      post: {
        mediaType: finalMediaType,
        mediaUrl: finalMediaUrl,
        hookTitle: parsedData.post?.hookTitle || parsedData.hookTitle || '질문하는 순간, 새로운 세상이 열려! 💡',
        caption: parsedData.post?.caption || '반가워요! AI 크리에이터 미오(MIO)입니다 🐱✨\n\n✔ 상상 속 아이디어를 현실로 만드는 창작 여정\n✔ 누구나 쉽게 따라하는 AI 숏폼 꿀팁\n✔ 복잡한 건 빼고 실전 팁만 쏙쏙!\n\n앞으로 함께 성장해 갈 분들은 팔로우해 주세요 🚀',
        hashtags: rawTags,
        soundTitle: parsedData.post?.soundTitle || '오리지널 사운드 - Mio Theme Song',
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