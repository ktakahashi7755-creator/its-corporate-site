# ふぁみりんく（FamilyLink）

**家族みんなで子育てを運営する生活インフラアプリ**

ママだけが知っている状態をなくし、家族全員で子どもまわりをスムーズに運営できる
iPhone / Android 両対応のモバイルアプリです。

---

## 📋 機能一覧（MVP）

| 機能 | 状態 |
|------|------|
| オンボーディング | ✅ 実装済み |
| ログイン / 新規登録（メール） | ✅ 実装済み |
| Googleログイン | ⚠️ EAS Build後に有効化 |
| 家族グループ作成 | ✅ 実装済み |
| 招待コードで家族参加 | ✅ 実装済み |
| お子さん複数登録 | ✅ 実装済み |
| ホーム画面サマリー | ✅ 実装済み |
| カレンダー（イベント管理） | ✅ 実装済み |
| 明日の準備（持ち物チェック） | ✅ 実装済み |
| 家族共有ボード（タスク） | ✅ 実装済み |
| 体調記録 | ✅ 実装済み |
| プリント読取 AI（要OpenAI key） | ✅ 実装済み（Edge Function） |
| 通知一覧 | ✅ 実装済み |
| 設定・家族招待 | ✅ 実装済み |
| Supabase Realtime 同期 | ✅ 実装済み |
| ローカル通知（明日の準備） | ✅ 実装済み |
| FCM プッシュ通知 | 🔲 EAS Build後に設定 |
| Apple ID ログイン | 🔲 EAS Build後に設定 |

---

## 🚀 セットアップ手順

### 1. 前提条件

- Node.js 18以上（推奨 v22）
- npm 9以上
- Expo CLI: `npm install -g expo-cli`
- Supabaseアカウント（https://supabase.com）

### 2. リポジトリ取得 & インストール

```bash
# リポジトリをクローン（またはfamilinkフォルダに移動）
cd familink

# 依存関係をインストール
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集し、Supabaseの接続情報を入力：

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 4. Supabase セットアップ

#### 4-1. プロジェクト作成
1. https://supabase.com でプロジェクトを新規作成
2. Settings → API から URL と anon key をコピー

#### 4-2. データベース マイグレーション適用

Supabase Dashboard → SQL Editor → New Query で以下を実行：

```sql
-- supabase/migrations/001_initial.sql の全内容をコピー&ペーストして実行
```

または Supabase CLI を使用：

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

#### 4-3. Edge Function のデプロイ（プリント読取AI）

```bash
supabase functions deploy scan-print
supabase secrets set OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY
```

### 5. アプリを起動

```bash
npm start
# または
npx expo start
```

---

## 📱 スマホ実機プレビュー手順

### iOS / Android 共通

1. スマホに **Expo Go** アプリをインストール
   - iOS: App Store で「Expo Go」を検索
   - Android: Google Play で「Expo Go」を検索

2. `npm start` を実行後、ターミナルに表示される QR コードをスキャン
   - iOS: カメラアプリで QR コードをスキャン → Expo Go で開く
   - Android: Expo Go アプリ内で QR コードをスキャン

### 同一ネットワーク
PCとスマホが同じ Wi-Fi に接続されている必要があります。

---

## 🪟 Windows での起動方法

1. Node.js をインストール（https://nodejs.org、LTS版推奨）
2. PowerShell または Command Prompt を管理者権限で開く
3. 以下を実行：

```powershell
cd familink
npm install
npm start
```

4. ブラウザが自動で開く、またはターミナルの QR コードをスキャン

---

## 🗄️ データベース構成

| テーブル | 説明 |
|----------|------|
| `families` | 家族グループ |
| `family_members` | 家族メンバー |
| `children` | 子ども情報 |
| `events` | カレンダーイベント |
| `checklist_items` | 持ち物チェックリスト |
| `health_logs` | 体調記録 |
| `documents` | プリント画像・AI結果 |
| `tasks` | 家族共有タスク |
| `notifications` | 通知 |

全テーブルに Row Level Security (RLS) が適用され、family単位でアクセス制御しています。

---

## 🔧 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Expo SDK 51 / React Native 0.74 |
| ルーティング | Expo Router v3 |
| 言語 | TypeScript |
| 認証 | Supabase Auth |
| データベース | Supabase PostgreSQL |
| ストレージ | Supabase Storage |
| リアルタイム | Supabase Realtime |
| AI | OpenAI GPT-4o Vision（Edge Function経由） |
| 状態管理 | Zustand |
| 通知 | Expo Notifications |
| カレンダーUI | react-native-calendars |
| ビルド | EAS Build対応済み構成 |

---

## 🔮 今後の優先TODO

### 短期（v1.1）
- [ ] Google / Apple ID ログイン（EAS Build後）
- [ ] FCM プッシュ通知（本番）
- [ ] 提出物リマインダー通知の自動化
- [ ] 子ども詳細画面の編集機能
- [ ] カレンダーの繰り返しイベント対応
- [ ] チェックリストの子ども別フィルター

### 中期（v1.2）
- [ ] 祖父母向け「閲覧のみ」招待
- [ ] 家族アルバム機能
- [ ] 献立管理
- [ ] 月別体調グラフ
- [ ] 通知の詳細カスタマイズ

### 長期
- [ ] App Store / Google Play 公開
- [ ] Supabase Edge Function の本番最適化
- [ ] マルチ言語対応（英語）
- [ ] 幼稚園・学校との直接連携API

---

## 📂 ディレクトリ構成

```
familink/
├── app/                       # Expo Router スクリーン
│   ├── _layout.tsx            # ルートレイアウト（Auth監視）
│   ├── index.tsx              # ルートリダイレクト
│   ├── (auth)/                # 認証フロー
│   │   ├── onboarding.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (main)/                # メインタブ
│   │   ├── index.tsx          # ホーム
│   │   ├── calendar.tsx
│   │   ├── board.tsx
│   │   ├── notifications.tsx
│   │   └── settings.tsx
│   ├── setup/                 # 初期セットアップ
│   │   ├── family.tsx
│   │   └── children.tsx
│   ├── children/              # 子ども詳細
│   ├── health/                # 体調記録
│   ├── tomorrow/              # 明日の準備
│   └── print-scan/            # プリント読取
├── components/ui/             # 共通UIコンポーネント
├── constants/                 # 色・テーマ定数
├── hooks/                     # カスタムHooks
├── lib/                       # Supabase、通知、ユーティリティ
├── store/                     # Zustand ストア
├── types/                     # TypeScript型定義
├── assets/                    # アイコン・スプラッシュ
└── supabase/
    ├── migrations/            # SQLマイグレーション
    ├── functions/             # Edge Functions（scan-print）
    └── seed.sql               # サンプルデータ
```

---

## ⚙️ 必要な環境変数

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase公開キー | ✅ |
| `OPENAI_API_KEY` | プリント読取AI（Edge Functionで使用） | オプション |

---

## 📦 EAS Build（実機ビルド）

```bash
npm install -g eas-cli
eas login
eas build:configure

# iOS
eas build --platform ios

# Android
eas build --platform android
```

`app.json` の `extra.eas.projectId` にEASプロジェクトIDを設定してください。

---

## 🏪 ストア公開までの残タスク

1. EAS Build でプロジェクトID取得・設定
2. Apple Developer Program / Google Play Console 登録
3. アプリアイコン・スプラッシュ画面の本番素材作成
4. プライバシーポリシー・利用規約ページの本番URL設定
5. Supabase 本番環境のセキュリティ設定最終確認
6. FCM（Firebase Cloud Messaging）設定
7. App Store / Google Play 審査提出
8. スクリーンショット・説明文の作成（日本語）
