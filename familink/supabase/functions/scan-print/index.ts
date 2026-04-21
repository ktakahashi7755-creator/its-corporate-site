// Supabase Edge Function: scan-print
// OpenAI Vision API でプリントを読み取り、JSON を返す

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

const SYSTEM_PROMPT = `
あなたは日本語の学校・保育園・幼稚園のプリントを読み取るAIアシスタントです。
画像からプリントの内容を正確に読み取り、以下のJSON形式で返してください。

返却するJSONの形式:
{
  "event_name": "イベント名（文字列）",
  "event_date": "YYYY-MM-DD形式の日付（文字列）",
  "start_time": "HH:MM形式の時刻（文字列、不明な場合は空文字）",
  "items_to_bring": ["持ち物1", "持ち物2"],
  "submission_deadline": "YYYY-MM-DD形式の提出期限（文字列、不明な場合は空文字）",
  "submission_items": ["提出物1", "提出物2"],
  "notes": "注意事項・メモ（文字列）",
  "summary": "プリントの要約（50文字以内の文字列）",
  "confidence": 0.9
}

注意:
- 日付は必ず YYYY-MM-DD 形式にしてください（例: 2024-06-15）
- 年が書かれていない場合は現在の年を使用してください
- 読み取れない項目は空文字または空配列にしてください
- confidenceは0.0〜1.0の範囲で、読み取り精度を示してください
- JSONのみ返却し、それ以外の文字は含めないでください
`.trim();

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'image_base64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      // Return mock result when API key is not set (development mode)
      const mockResult = {
        event_name: 'サンプルイベント',
        event_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        start_time: '09:00',
        items_to_bring: ['お弁当', '水筒', 'タオル'],
        submission_deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        submission_items: ['参加確認書'],
        notes: '雨天中止の場合は連絡帳にてお知らせします',
        summary: 'サンプルプリントの読み取り結果です',
        confidence: 0.5,
      };
      return new Response(
        JSON.stringify({ result: mockResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                  detail: 'high',
                },
              },
              { type: 'text', text: 'このプリントの内容を読み取ってください。' },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openaiData = await response.json();
    const content = openaiData.choices?.[0]?.message?.content ?? '{}';

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = {
        event_name: '',
        event_date: '',
        start_time: '',
        items_to_bring: [],
        submission_deadline: '',
        submission_items: [],
        notes: content,
        summary: 'AI読取完了（手動確認が必要です）',
        confidence: 0.3,
      };
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('scan-print error:', error);
    return new Response(
      JSON.stringify({ error: String(error), result: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
