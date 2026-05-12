# cycle-map

複数のシェアサイクル (HELLO CYCLING / ドコモ・バイクシェア) を横断して、
**今この瞬間に借りられる/返せるポート** を地図から探せる Web アプリ。

- アプリインストール不要 (Web 完結)
- 現在地から最寄りポートを表示
- 「返却可能」を重視: 空きラック数も同時に可視化
- URL に位置・ズーム・サービスフィルタが保持され、共有しやすい
- ズームアウト時にサービス提供0件の都道府県を可視化

設計の背景・コンセプトは [concept.md](./concept.md) を参照。

---

## 技術スタック

| 層 | 採用 |
|---|---|
| フロントエンド | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind |
| 地図 | MapLibre GL JS + Protomaps (フォールバック: OSM raster) |
| キャッシュ | Upstash Redis (Vercel Marketplace) — 動的な空き状況 |
| DB | Neon Postgres + Drizzle ORM — 静的ポート情報 |
| データ取得 | Vercel Cron で定期ポーリング |
| ホスティング | Vercel |
| データソース | 公共交通オープンデータセンター (ODPT) 経由の GBFS |

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
pnpm install
```

### 2. 必要なアカウント/トークンを揃える

| 項目 | 取得先 | 必須 |
|---|---|---|
| ODPT アクセストークン | <https://developer.odpt.org/> で会員登録 (無料) → アクセストークン発行 | ✓ |
| Upstash Redis (Vercel Marketplace) | Vercel ダッシュボード → Storage → Create → KV | ✓ |
| Neon Postgres | <https://neon.tech/> もしくは Vercel ダッシュボード → Storage → Create → Postgres | ✓ |
| Protomaps API キー | <https://protomaps.com/> | 任意 (未設定なら OSM ラスタ) |
| Cron Secret | 任意の長いランダム文字列 | 本番のみ |

### 3. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成。

```bash
cp .env.example .env.local
```

`.env.local` の中身:

```env
# ODPT
ODPT_CONSUMER_KEY=取得したアクセストークン

# (任意) ODPT 上の system_id を上書きする場合
# ODPT_HELLOCYCLING_SYSTEM_ID=openstreet
# ODPT_DOCOMO_SYSTEM_ID=docomo-cycle-tokyo

# Upstash Redis (Vercel Marketplace の Upstash for Redis 統合で自動注入)
# Vercel KV のサンセット後も後方互換のため KV_* の名前で来る
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Neon Postgres
DATABASE_URL=postgresql://...

# Cron secret (本番のみ)
CRON_SECRET=

# Protomaps (任意)
NEXT_PUBLIC_PROTOMAPS_API_KEY=
```

> **HELLO CYCLING の system_id について**: 仮で `openstreet` を入れている。ODPT 登録後にダッシュボードで実際のエンドポイントを確認し、違っていれば `ODPT_HELLOCYCLING_SYSTEM_ID` で上書きする。

### 4. データベースを初期化

```bash
pnpm db:push
```

`stations` テーブルが作成される。

### 5. データを 1 回流し込む

```bash
pnpm poll:once
```

ODPT から HELLO CYCLING / ドコモのポート情報を取得し、Postgres と KV に書き込む。
出力例:

```
[hellocycling] fetching... ok: 12345 stations / 12345 statuses
[docomo] fetching... ok: 800 stations / 800 statuses
```

### 6. 都道府県境界 GeoJSON を配置 (任意)

ズームアウト時のコロプレスを有効化したい場合のみ、`public/prefectures.json` に
都道府県境界の GeoJSON を配置する。

- 推奨: <https://github.com/dataofjapan/land> の `japan.topojson` を GeoJSON に変換
- 各 Feature の `properties.pref_code` に JIS 都道府県コード (`"01"`〜`"47"`) を入れる

未配置でもコロプレス以外は通常通り動作する。

### 7. 開発サーバーを起動

```bash
pnpm dev
```

<http://localhost:3000> を開く。

---

## 使い方 (エンドユーザー)

| 操作 | 結果 |
|---|---|
| 地図を移動 | 表示範囲に応じてポートが自動で読み込まれる |
| 右上のロケートボタン | 現在地へジャンプ |
| 左上のサービスフィルタ | HELLO CYCLING / ドコモ を個別にオン/オフ |
| ポートマーカーをクリック | 借りられる台数・返せる台数・最終更新時刻を表示 |
| 緑/黄/赤マーカー | 空きが十分/少ない/0 |
| 青いまるい数字 | クラスタ。クリックすると展開ズーム |
| ズームアウト | 都道府県カバレッジを塗り分け表示 (GeoJSON 配置時のみ) |
| URL | 現在の位置・ズーム・フィルタが保存される。共有/ブックマーク可能 |

---

## ディレクトリ構成

```
cycle-map/
├── app/
│   ├── layout.tsx                  # ルートレイアウト・メタタグ
│   ├── page.tsx                    # トップ (地図ビュー)
│   ├── error.tsx                   # エラーバウンダリ
│   ├── robots.ts                   # /robots.txt
│   ├── globals.css                 # Tailwind + ポップアップスタイル
│   ├── components/
│   │   ├── MapView.tsx             # 地図メイン (MapLibre)
│   │   ├── ServiceFilter.tsx       # サービスフィルタ UI
│   │   ├── StationPopup.tsx        # ポップアップ HTML 生成
│   │   ├── CoverageLayer.ts        # 都道府県コロプレス
│   │   └── Footer.tsx              # ライセンス表記
│   ├── hooks/
│   │   ├── useUrlState.ts          # URL ↔ 状態 同期
│   │   └── useStations.ts          # /api/stations のフェッチ
│   └── api/
│       ├── stations/route.ts       # bbox 検索
│       ├── coverage/route.ts       # 都道府県集計
│       └── cron/
│           ├── poll/route.ts       # 動的データの定期取得
│           └── refresh-static/route.ts  # 静的データの日次同期
├── lib/
│   ├── gbfs/
│   │   ├── client.ts               # ODPT 経由 fetch (リトライ付)
│   │   ├── types.ts                # GBFS / 統一 Station 型 (zod)
│   │   ├── normalize.ts            # 各サービスを統一スキーマへ
│   │   └── adapters/
│   │       ├── hellocycling.ts
│   │       └── docomo.ts
│   ├── providers.ts                # プロバイダ一覧 / ディスパッチ
│   ├── kv.ts                       # Upstash Redis ラッパ
│   ├── db.ts                       # Drizzle (Neon)
│   └── geo.ts                      # bbox / 都道府県判定
├── db/
│   └── schema.ts                   # stations テーブル定義
├── scripts/
│   └── poll-once.ts                # 単発ポーリング (動作確認用)
├── public/
│   └── prefectures.json            # ※自分で配置 (任意)
├── drizzle.config.ts
├── vercel.json                     # Vercel Cron 設定
└── concept.md                      # 設計コンセプト
```

---

## スクリプト

```bash
pnpm dev          # 開発サーバー
pnpm build        # 本番ビルド
pnpm start        # ビルド済みの起動
pnpm typecheck    # 型チェック
pnpm lint         # ESLint
pnpm db:push      # スキーマを DB に同期 (開発時)
pnpm db:generate  # マイグレーションファイル生成
pnpm db:migrate   # マイグレーション実行
pnpm poll:once    # GBFS を 1 回ポーリング (確認用)
```

---

## 本番デプロイ (Vercel)

1. Vercel に新規プロジェクトとして接続
2. Storage → Marketplace から **Upstash for Redis** と **Neon Postgres** を Install → 環境変数が自動注入される
3. プロジェクト設定の Environment Variables に以下を追加:
   - `ODPT_CONSUMER_KEY`
   - `CRON_SECRET` (任意の長い文字列)
   - `NEXT_PUBLIC_PROTOMAPS_API_KEY` (任意)
4. Deploy
5. 初回デプロイ後、Vercel ダッシュボードの Cron Jobs タブで以下が登録されていることを確認:
   - `/api/cron/poll` (`*/2 * * * *`)
   - `/api/cron/refresh-static` (`0 3 * * *`)
6. 任意で `/api/cron/refresh-static` を 1 回手動実行してテーブルを埋める

> **注意**: Vercel Hobby プランは Cron が日次のみ。分単位で叩きたい場合は Pro 以上が必要。

---

## データソースとライセンス

- HELLO CYCLING (OpenStreet 株式会社): GBFS / CC BY 4.0
  - <https://ckan.odpt.org/dataset/c_bikeshare_gbfs-openstreet>
- ドコモ・バイクシェア (東京エリア): GBFS / CC BY 4.0
  - <https://ckan.odpt.org/ja/dataset/c_bikeshare_gbfs-d-bikeshare>
- 配信は **公共交通オープンデータセンター** 経由 — <https://www.odpt.org/>

> ドコモ・バイクシェアの ODPT 経由オープンデータは現状 **東京都内エリアのみ**。横浜・川崎・仙台・広島等は本アプリでは表示されない。

UI フッターに「出典: 公共交通オープンデータセンター (CC BY 4.0)」のクレジットを常時表示している。CC BY 4.0 の条件に従って必ず保持すること。

---

## 拡張ロードマップ

- **フェーズ2**: エリア別 SEO ページ (`/area/tokyo/shibuya` 等)、お気に入りポート (LocalStorage)、経路提案 (徒歩+自転車)
- **フェーズ3**: LUUP / PiPPA / COGICOGI / ecobike の GBFS 提供調査・追加
- **フェーズ4**: 都市移動データ可視化 (ヒートマップ / 利用傾向)、B2B 分析向け API

実装計画の全文は `~/.claude/plans/concept-md-mighty-storm.md` を参照。

---

## トラブルシューティング

| 症状 | 原因と対応 |
|---|---|
| `ODPT_CONSUMER_KEY is not set` | `.env.local` を作成し ODPT トークンを設定 |
| `DATABASE_URL is not set` | Neon Postgres を作成し接続文字列を設定 |
| 地図は出るがポートが表示されない | `pnpm poll:once` を 1 回実行してデータを入れる / DevTools の `/api/stations` レスポンスを確認 |
| Vercel Cron が動かない | プランが Hobby の場合は分単位 Cron 不可。Pro 以上にアップグレードするか、外部の cron サービスから `/api/cron/poll` を `Authorization: Bearer $CRON_SECRET` で叩く |
| ポートが大量に表示されて重い | クラスタリングはズーム 14 以下で有効。`MapView.tsx` の `clusterMaxZoom` を調整 |
| 都道府県カバレッジが出ない | `public/prefectures.json` を配置する (上記セットアップ手順 6 を参照) |
