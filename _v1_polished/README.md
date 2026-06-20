# ITS合同会社サイト v1 バックアップ

**スナップショット日時**: 2026-06-20  
**ブランチ**: claude/its-corporate-site-WOQhD

## ファイル構成

```
_v1_polished/
├── index.html        # ITS合同会社 コーポレートページ
├── familink.html     # Familink プロダクトページ
├── privacy.html      # プライバシーポリシー
├── terms.html        # 利用規約
├── css/
│   ├── style.css     # デザイントークン・リセット（全変数定義）
│   ├── nav.css       # ナビゲーション
│   ├── hero.css      # ヒーローセクション・ボタン基底
│   ├── sections.css  # 全セクション・コンポーネント
│   └── footer.css    # フッター
├── js/
│   └── main.js       # スクロール・ハンバーガー・パーティクル・フォーム
└── images/
    └── logo.svg      # ITSロゴ

## カラーパレット

| 用途             | 変数                   | 値         |
|------------------|------------------------|------------|
| プライマリ (青)   | --color-primary        | #0A84FF    |
| グラデーション    | --grad-primary         | 135deg→#5AC8FA |
| ゴールドアクセント| --color-gold           | #C9A84C    |
| 背景 (白)        | --color-bg             | #FFFFFF    |
| 背景 (淡青)      | --color-bg-2           | #F0F8FF    |
| テキスト         | --color-text           | #1C1C1E    |

## デザイン構造

- **ヒーロー**: ダーク紺グラデーション + Canvas パーティクル (金・青・白)
- **コンテンツセクション**: 白 / 淡青 交互
- **ナビ**: 透明（ダークヒーロー上）→ スクロールで白背景切り替え
- **フォント**: Cormorant Garamond (見出し serif) + Noto Sans JP + Poppins

## TODO（実装後に対応）

- [ ] `index.html` のフォーム `action="#"` を Formspree 等に変更
- [ ] `screenshots/` に実際のアプリスクリーンショットを配置
- [ ] `assets/` にアプリアイコンを配置
- [ ] `og:url` を本番 URL に更新
- [ ] `main` ブランチにマージして GitHub Pages を本番反映
