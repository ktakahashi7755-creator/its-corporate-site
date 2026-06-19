# ITS合同会社 コーポレートサイト — 引き継ぎプロンプト

---

## ▼ このプロンプトの使い方

以下の内容をそのままAI（Claude等）に貼り付けることで、同等のコーポレートサイトを新規作成・追加開発・保守できます。

---

## ■ プロジェクト概要

**クライアント**: ITS合同会社  
**サイト種別**: BtoBコーポレートサイト（静的HTML/CSS/JS）  
**目的**: リード獲得（問い合わせ）・信頼構築・営業ツール・サービス訴求  
**ターゲット**: 中小企業の経営者・役員・IT担当者  

---

## ■ 会社情報

| 項目 | 内容 |
|------|------|
| 社名 | ITS合同会社 |
| 代表 | 高橋 賢弥 |
| 所在地 | 東京都新宿区西新宿3-3-13 西新宿水間ビル2階 |
| 設立 | 2024年8月 |
| メール | info@its-tokyo.com |
| ブランドスローガン | STARS YOUR TECHNOLOGY |
| ミッション | IT人材の可能性を広げ、一人ひとりの価値創造を支援する |
| ビジョン | 多様な才能を結集し、未来を切り拓くITソリューションを提供する |
| バリュー | 常に新しい技術と発想を取り入れ、持続的な成長を実現する |

### 提供サービス（3本柱）
1. **システム受託開発** — 業務フローに合わせた設計・開発・改善
2. **ITコンサルティング** — IT活用方針の整理から実務レベルの具体化
3. **Web制作 / LP制作** — BtoB向け信頼感重視のサイト・LP制作

### 選ばれる理由（6項目）
1. 事業目線・営業目線・技術目線を統合
2. コンサルだけで終わらない（実装まで一貫）
3. 制作だけで終わらない（成果まで踏み込む）
4. 実務レベルまで具体化できる
5. AI活用によるスピード感
6. BtoBの信頼感ある見せ方ができる

---

## ■ デザイン方針

**コンセプト**: ラグジュアリー × プロフェッショナル  
**カラーテーマ**: ブラック/ネイビー地 × ゴールドアクセント  
**フォント**: Cormorant Garamond（見出し装飾）+ Noto Sans JP（本文）  

### デザイントークン（CSS Custom Properties）

```css
:root {
  /* ── Backgrounds ── */
  --color-bg:          #050a14;
  --color-bg-2:        #08111f;
  --color-bg-3:        #0a1628;
  --color-bg-card:     rgba(10, 22, 40, 0.85);

  /* ── Gold Palette ── */
  --color-gold:        #c9a84c;
  --color-gold-light:  #e8c96d;
  --color-gold-dark:   #9d7f38;
  --color-gold-pale:   rgba(201, 168, 76, 0.08);

  /* ── Text ── */
  --color-white:       #ffffff;
  --color-text:        #dde6ef;
  --color-text-2:      #8ba0b8;
  --color-text-3:      #4a6080;

  /* ── Borders ── */
  --color-border:        rgba(201, 168, 76, 0.22);
  --color-border-subtle: rgba(255, 255, 255, 0.06);

  /* ── Typography ── */
  --font-serif: 'Cormorant Garamond', 'Georgia', serif;
  --font-sans:  'Noto Sans JP', 'Inter', sans-serif;

  /* ── Spacing ── */
  --container-max: 1200px;
  --pad-x:    clamp(20px, 5vw, 80px);
  --section-y: clamp(72px, 10vw, 128px);

  /* ── Radius ── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* ── Transitions ── */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 0.2s;
  --duration-base: 0.35s;

  /* ── Shadows ── */
  --shadow-gold: 0 0 32px rgba(201, 168, 76, 0.12);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.45);
}
```

---

## ■ ファイル構成

```
/
├── index.html                  # トップページ
├── company.html                # 会社概要
├── services.html               # サービス一覧
├── service-development.html    # サービス詳細：システム受託開発
├── service-consulting.html     # サービス詳細：ITコンサルティング
├── service-web.html            # サービス詳細：Web制作/LP制作
├── works.html                  # 実績紹介
├── contact.html                # お問い合わせ
├── faq.html                    # よくある質問
├── privacy.html                # プライバシーポリシー
├── css/
│   ├── style.css               # デザイントークン + リセット + ユーティリティ
│   ├── nav.css                 # ナビゲーション（固定ヘッダー + ドロワー）
│   ├── hero.css                # ヒーローセクション + ボタン + アニメーション
│   ├── sections.css            # 各セクション共通（カード、グリッド、CTA等）
│   ├── footer.css              # フッター
│   └── page.css                # サブページ共通（ページヒーロー、フォーム、FAQ等）
├── js/
│   └── main.js                 # ナビスクロール + ハンバーガー + フェードイン + パーティクル
└── images/
    └── logo.svg                # SVGモノグラムロゴ（silver ITS + gold S）
```

---

## ■ CSS アーキテクチャ

### style.css の役割
- デザイントークン（`:root`変数）
- CSSリセット（box-sizing, margin, padding等）
- レイアウトユーティリティ（`.container`, `.section`, `.section--alt`）
- スクロールフェードアニメーション（`.js-fade`, `.is-visible`, `.delay-1~3`）

### nav.css の役割
- 固定ヘッダー（透明→スクロール後にブラー背景）
- ロゴ（SVG画像 + テキスト）
- デスクトップメニュー（ゴールドアンダーラインhover）
- CTAボタン（ゴールドボーダー）
- ハンバーガーボタン（3本線→X変形）
- モバイルドロワー（全画面オーバーレイ）
- レスポンシブ分岐：768px

### hero.css の役割
- フルビューポートヒーロー（100svh）
- Canvas要素のパーティクル背景
- アイウォード、H1タイトル、英語キャッチ、説明文、CTAボタン2個
- スクロールインジケーター（バー + アニメーション）
- `.btn--primary`（ゴールド塗り）、`.btn--outline`（透明ボーダー）
- 各要素のフェードアップアニメーション（@keyframes）

### sections.css の役割
- セクションヘッダー（`.section-header`, `.section-label`, `.section-title`, `.gold-rule`）
- サービスカード（`.svc-card`）— ホバーで上部ゴールドライン出現
- 強みグリッド（`.strengths-grid`, `.str-item`）
- 実績カード（`.work-card`）— 画像ズームhover
- CTAセクション（`.cta-section`）— ゴールド水平線デコレーション
- Aboutストリップ（`.about-strip`）— 2カラム + 4MVVカード
- CEOティーザー（`.ceo-teaser`）— 画像 + 左ゴールドボーダー引用
- ゴーストボタン（`.btn--ghost`, `.btn--gold-outline`）
- レスポンシブ：1024px（2カラム）/ 640px（1カラム）

### footer.css の役割
- 4カラムグリッドフッター（ブランド / サービス / 会社 / 連絡先）
- フッターブランドロゴ（SVG + テキスト）
- ボトムバー（コピーライト + リンク）
- レスポンシブ：768px

### page.css の役割
- サブページ共通ヒーロー（`.page-hero` + パンくず）
- 会社概要テーブル（`.company-table`）
- MVVグリッド（`.mvv-grid`）
- お問い合わせフォーム（`.form-ctrl` ゴールドフォーカスグロー）
- FAQアコーディオン（`.faq-item.is-open`）
- プライバシーポリシー散文スタイル（`.privacy-prose`）

---

## ■ JavaScript 機能（js/main.js）

```javascript
// 4つの機能をDOMContentLoadedで初期化
document.addEventListener('DOMContentLoaded', function () {
  initNavScroll();   // スクロール>40pxでnav.is-scrolled付与（ブラー背景）
  initHamburger();   // ハンバーガーボタン開閉（body scroll lock）
  initScrollFade();  // .js-fade要素をIntersectionObserverで.is-visible付与
  initParticles();   // Canvasパーティクル（silver 88% + gold 12%、接続線付き）
});
```

**パーティクル仕様:**
- 画面サイズに応じた数（`width×height / 14000`、最大100個）
- シルバー: `rgba(139,160,184,α)` / ゴールド: `rgba(201,168,76,α)`
- 距離100px未満で接続線（ゴールド半透明）
- ウィンドウリサイズで再初期化

---

## ■ ロゴ（images/logo.svg）

円形ベース（#0a1628）+ ゴールドリング枠  
シルバーグラデーション「I」（左縦棒）+「T」（横棒+右縦棒）  
ゴールドグラデーション斜体「S」のテキストオーバーレイ  

nav使用: `<img src="images/logo.svg" alt="ITS" class="nav__logo-img" width="36" height="36">`  
footer使用: `<img src="images/logo.svg" alt="ITS" class="footer__brand-img" width="30" height="30">`

---

## ■ 各ページ構成

### index.html（トップページ）
1. Hero — Canvas背景 + キャッチコピー「テクノロジーで世界を輝かせる」+ CTA2個
2. About Strip — 2カラム（説明文 + Mission/Vision/Value/AI活用 カード）
3. Services — 3カードグリッド（各詳細ページへリンク）
4. Strengths — 6項目グリッド「選ばれる理由」
5. Works — 3実績カード（Unsplash画像使用） + 「すべて見る」リンク
6. CEO Teaser — 代表写真 + 引用 + メッセージ
7. CTA Section — 「まずはお気軽にご相談」+ ボタン2個

### company.html（会社概要）
- ページヒーロー + パンくず
- 会社情報テーブル（社名/代表/設立/所在地/事業内容/資本金/メール）
- MVVグリッド（Mission/Vision/Value）
- CTAセクション

### services.html（サービス一覧）
- ページヒーロー
- 3サービスカードグリッド
- 強みセクション（3項目）
- CTAセクション

### service-development.html / service-consulting.html / service-web.html（各サービス詳細）
- ページヒーロー
- 2カラムイントロ（Unsplash画像 + チェックリスト付き説明）
- 4ステッププロセスグリッド
- CTAセクション

### works.html（実績紹介）
- ページヒーロー
- 3実績記事（画像+テキスト詳細、タグ付き）

### contact.html（お問い合わせ）
- ページヒーロー
- 2カラム（連絡先情報 + フォーム）
- フォーム項目: 会社名/氏名/メール/サービス選択/メッセージ/プライバシー同意
- インラインJSバリデーション

### faq.html（よくある質問）
- ページヒーロー
- 3カテゴリ（一般/開発/Web）× アコーディオン形式

### privacy.html（プライバシーポリシー）
- ページヒーロー
- 8セクション散文

---

## ■ アニメーション仕様

### スクロールフェードイン
```css
.js-fade {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}
.js-fade.is-visible { opacity: 1; transform: none; }
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
```
使い方: `<div class="js-fade delay-1">` → JSのIntersectionObserverが`.is-visible`付与

### ヒーロー要素アニメーション
- hero__eyebrow: fadeIn 0.8s → 0.2s delay
- hero__title: fadeUp 1s → 0.4s delay
- hero__en: fadeUp 0.8s → 0.7s delay
- hero__desc: fadeUp 0.8s → 0.9s delay
- hero__actions: fadeUp 0.8s → 1.1s delay

---

## ■ レスポンシブブレークポイント

| ブレークポイント | 主な変化 |
|---|---|
| `max-width: 1024px` | グリッド2カラム化（サービス・実績・強み・About・CEO） |
| `max-width: 768px` | ナビ非表示→ハンバーガー表示、フッター縦積み |
| `max-width: 640px` | グリッド1カラム、CTAボタン縦積み |

---

## ■ 外部リソース

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">

<!-- 実績・CEO画像（Unsplashプレースホルダー） -->
<!-- 運送業 --> https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=640&auto=format&q=75
<!-- CRM --> https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&auto=format&q=75
<!-- アプリ --> https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&auto=format&q=75
<!-- CEO --> https://images.unsplash.com/photo-1560250097-0b93528c311a?w=560&auto=format&q=80
```

---

## ■ GitHub Pages デプロイ設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

リポジトリの Settings → Pages → Source: **GitHub Actions** に設定が必要。

---

## ■ 開発ルール（引き継ぎ先への注意事項）

1. **フレームワーク不使用** — 純粋なHTML/CSS/JS。ビルドシステム不要
2. **CSS分割** — 役割ごとに6ファイル分割（style.css / nav.css / hero.css / sections.css / footer.css / page.css）
3. **BEM命名** — `.ブロック__エレメント--モディファイア`（例: `.svc-card__title`, `.nav__hamburger.is-open`）
4. **アニメーション** — `.js-fade` + `.delay-N` をHTMLに付与、JSがトリガー
5. **画像** — 本番は実際の写真に差し替え（現在Unsplash CDNのプレースホルダー使用）
6. **カラー** — 必ずCSS変数（`var(--color-gold)`等）を使用。ハードコード禁止
7. **間隔** — `clamp()` + CSS変数（`var(--section-y)`, `var(--pad-x)`）で流動的に

---

## ■ 追加開発が必要な箇所（残タスク）

- [ ] お問い合わせフォームのバックエンド連携（Formspree / Netlify Forms等）
- [ ] 代表・実績の実際の写真への差し替え
- [ ] OGP / Twitter Card メタタグ追加
- [ ] favicon の実サイト用画像への差し替え
- [ ] Google Analytics / GTM 設置
- [ ] 採用ページ（recruit.html）追加の可能性
- [ ] Works実績の追加（現在3件）

---

## ■ AIへの指示テンプレート

このサイトに新しいページや機能を追加するときは、以下のパターンで指示してください:

```
【追加要件】
- ページ名: ○○.html
- 目的: ～
- セクション構成: ～
- 流用するコンポーネント: page-hero / section-header / svc-card / work-card / cta-section 等

【制約】
- 既存デザイントークン（CSS変数）を必ず使用
- 新規CSSはpage.cssに追記、またはインライン<style>で対応
- js/main.js のinitScrollFade()との連携（.js-fade付与）
- ナビ・フッターは既存ページと同一構造を維持
```

---

*このドキュメントはITS合同会社コーポレートサイトの完全な引き継ぎ情報です。*  
*最終更新: 2026年6月*
