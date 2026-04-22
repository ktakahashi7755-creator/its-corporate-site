import { ExtractedData } from '../types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

const SYSTEM_PROMPT = `あなたは日本の保育園・小学校のプリントを解析するアシスタントです。
以下の画像から情報を抽出し、必ず以下のJSONフォーマットで返してください。
情報が見当たらない場合はnullを返してください。

{
  "event_name": "イベント名",
  "event_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "items": ["持ち物1", "持ち物2"],
  "submission_deadline": "YYYY-MM-DD",
  "submission_items": ["提出物1", "提出物2"],
  "notes": "その他注意事項",
  "tasks": ["やること1", "やること2"]
}`;

export async function extractFromPrintImage(
  base64Image: string
): Promise<ExtractedData | null> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message ?? 'OpenAI APIエラー');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as ExtractedData;
  } catch {
    return null;
  }
}
