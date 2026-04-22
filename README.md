# ふぁみりんく — 子育て家族情報共有アプリ MVP

子育て家庭の「ワンオペ情報管理」を解消する、AI搭載の子育て生活インフラアプリ。

## 機能（MVP）

- 家族アカウント作成・招待
- 子ども複数登録
- ホーム画面（今日・明日のサマリー）
- カレンダー（イベント管理）
- 明日の準備チェックリスト
- 提出物・期限管理
- 体調記録
- 家族共有タスクボード
- プリント撮影 → AI読取 → 確認 → 登録
- プッシュ通知

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各値を設定してください。

### 3. Supabase セットアップ

1. [Supabase](https://supabase.com) でプロジェクト作成
2. `supabase/migrations/001_initial.sql` をSQL Editorで実行
3. Authentication → Providers でメール認証を有効化

### 4. 起動

```bash
npx expo start
```

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React Native (Expo ~52) |
| ルーティング | Expo Router v4 |
| バックエンド/DB | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| AI (OCR) | OpenAI GPT-4o Vision |
| 画像ストレージ | Supabase Storage |
| リアルタイム | Supabase Realtime |
| Push通知 | Expo Notifications (FCM対応設計) |

## ディレクトリ構成

```
app/
  _layout.tsx          # ルートレイアウト（認証制御）
  (auth)/              # 未認証画面
    login.tsx          # ログイン・新規登録
    onboarding.tsx     # 家族・子ども初期設定
  (tabs)/              # メインタブ
    index.tsx          # ホーム
    children.tsx       # 子ども一覧
    calendar.tsx       # カレンダー
    board.tsx          # 家族共有ボード
  child/[id].tsx       # 子ども詳細
  preparation/         # 明日の準備
  health/[childId].tsx # 体調記録
  print-scan.tsx       # プリント撮影・AI読取
  notifications.tsx    # 通知一覧
src/
  lib/
    supabase.ts        # Supabaseクライアント
    openai.ts          # OpenAI Vision API
  types/index.ts       # 型定義
  hooks/               # カスタムフック
  components/          # 共通UIコンポーネント
  constants/colors.ts  # カラーパレット
supabase/
  migrations/001_initial.sql  # DBスキーマ
```

## 残TODO

- [ ] Supabase Edge Function (OpenAI呼び出し) のデプロイ
- [ ] Firebase FCM 連携
- [ ] EAS Build設定 (eas.json)
- [ ] Google/Apple OAuth設定
- [ ] プッシュ通知スケジューリング (期限3日前・前日・当日)
- [ ] 招待コードURL scheme設定
- [ ] ストアアイコン・スプラッシュ画像の本番用素材
