# Familink コーポレートサイト

ITS合同会社が開発する家族向けアプリ「Familink」のコーポレートサイトです。

## 構成

```
/
├── index.html                 # メインLP（全セクション）
├── privacy.html               # プライバシーポリシー
├── terms.html                 # 利用規約
├── css/
│   └── style.css              # デザインシステム（tokens準拠）
├── js/
│   └── main.js                # Nav / アニメーション / フォーム
├── screenshots/               # ★ 実機スクリーンショットをここに配置
│   └── README.md              # 配置ガイド
└── assets/                    # ★ ブランド素材（アイコン・マスコット等）
    └── README.md              # 配置ガイド
```

## 素材の配置（必須）

### screenshots/
| ファイル       | 画面        |
|--------------|------------|
| hero.png     | ホーム画面  |
| calendar.png | カレンダー  |
| tasks.png    | やること    |
| budget.png   | 家計        |
| health.png   | 体調管理    |
| board.png    | 家族ボード  |

### assets/
| ファイル              | 用途             |
|---------------------|-----------------|
| app-icon-256.png    | アプリアイコン   |
| hoku-happy.png      | Hokumascot      |
| welcome-hero.webp   | ストーリー画像   |

> 画像が未配置の場合はCSSプレースホルダーが表示されます。

## 要設定箇所

| 場所                      | 内容                                      |
|--------------------------|------------------------------------------|
| index.html `<meta og:url>` | 本番URLに変更                             |
| index.html `<form action>` | Formspree等の送信先URLを設定             |
| index.html `og:image`     | OGP用画像パスを確認・設定                 |
| privacy.html / terms.html | 法務確認後に内容を正式化                  |

## デプロイ

### GitHub Pages（現在の設定）
```bash
git add -A
git commit -m "update"
git push origin main
```
mainブランチへのpushで自動デプロイ（`.github/workflows/` 参照）。

### Vercel（推奨）
1. [vercel.com](https://vercel.com) でプロジェクトをインポート
2. Framework: `Other`、Root Directory: `/`
3. Deploy — 以後pushで自動デプロイ

### Netlify
1. [netlify.com](https://netlify.com) でリポジトリを接続
2. Build command: なし、Publish directory: `/`
3. Deploy

## ブランド仕様

| Token           | 値                                        |
|----------------|------------------------------------------|
| Primary         | `#0A84FF`                                |
| Gradient        | `linear-gradient(135deg,#0A84FF,#5AC8FA)`|
| Secondary       | `#34C759`                                |
| Accent          | `#FF9F0A`                                |
| Background      | `#F2F2F7`                                |
| Font heading    | Poppins                                  |
| Font body       | Noto Sans JP                             |

---
© 2024 ITS合同会社
