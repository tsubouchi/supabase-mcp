## 基本設計書

### 1. 目的
ローカル環境で Supabase を用いて Postgres データベースを構築し、ポケモン図鑑（全国図鑑番号 0001〜0200）のデータ（名前・タイプ1・タイプ2）を保存する。さらに Supabase MCP を導入し、Cursor 上で自然言語からポケモンを検索できる仕組みを提供する。

### 2. システム構成図
```
┌──────────────┐          ┌────────────────────┐
│   Cursor IDE │──HTTP──▶│ Supabase Edge APIs │
└──────────────┘          │  (REST / RPC / MCP)│
                          └────────┬───────────┘
                                   │
                                   ▼
                          ┌────────────────────┐
                          │   Postgres (local) │
                          │   pokemons table   │
                          └────────────────────┘
```

### 3. 使用技術
1. Supabase CLI (Docker 内で Postgres + Edge Runtime 起動)
2. Postgres 15 (Supabase 同梱)
3. Supabase MCP (Model Chain Proxy) – 自然言語→SQL 変換
4. Node.js (v20) + TypeScript：データ取得・投入スクリプト
5. `cheerio` or `@supabase/node-fetch` 等のスクレイピング用ライブラリ

### 4. データモデル
| フィールド名 | 型 | 制約 | 説明 |
|--------------|----|------|------|
| id           | bigint | PK, 自動生成 | 内部用 ID |
| national_no  | integer | UNIQUE, NOT NULL | 全国図鑑番号 |
| name_ja      | text | NOT NULL | ポケモン名（日本語） |
| type_1       | text | NOT NULL | タイプ1 |
| type_2       | text | NULLABLE | タイプ2（存在しない場合 NULL） |
| inserted_at  | timestamptz | DEFAULT now() | 追加日時 |

RLS（Row Level Security）は読取専用で全ユーザに許可。書込はサービスロールのみ許可。

### 5. データ取得フロー
1. `scripts/fetch_pokemons.ts` で Wiki ( https://wiki.xn--rckteqa2e.com/... ) を GET。
2. `cheerio` で表をパースし、1〜200 行目を抽出。名前・タイプ1・タイプ2 を整形。
3. Supabase Service Key を用いて `pokemons` テーブルへ `upsert`。

### 6. MCP ワークフロー
1. Cursor から自然言語クエリを入力。
2. MCP が LLM（OpenAI GPT-4o 推奨）へプロンプトを送信し、SQL を生成。
3. 生成された SQL を Supabase エンドポイントへ実行し、結果を Cursor に返却。

プロンプト例:
```
ユーザ: "くさ／どくタイプのポケモンを教えて"
MCP   : SELECT * FROM pokemons WHERE type_1='くさ' AND type_2='どく';
```

#### より具体的なプロンプト例
- **テーブル構造の確認:** 「`pokemons` テーブルのカラム情報を教えて」
  - `DESCRIBE pokemons;` や `PRAGMA table_info(pokemons);` に類する情報取得クエリを期待 (MCPの対応状況による)
- **あいまい検索:** 「名前に「リザ」が含まれるポケモンを探して」
  - `SELECT * FROM pokemons WHERE name_ja LIKE '%リザ%';`
- **複数条件:** 「みずタイプで、かつ全国図鑑番号が100より小さいポケモンは？」
  - `SELECT * FROM pokemons WHERE (type_1='みず' OR type_2='みず') AND national_no < 100;`
- **件数指定:** 「じめんタイプのポケモンを5件だけ教えて」
  - `SELECT * FROM pokemons WHERE type_1='じめん' OR type_2='じめん' LIMIT 5;`

### 7. ディレクトリ構成
```
/ (プロジェクトルート)
├─ supabase/           # Supabase CLI が生成
│  ├─ migrations/
│  ├─ .env             # Supabase 変数
├─ scripts/
│  └─ fetch_pokemons.ts
├─ basic_design.md     # (本ファイル)
├─ TODO.md             # 工程管理 ToDo
└─ package.json
```

### 8. セキュリティ
- `.env` には `SUPABASE_SERVICE_ROLE_KEY` など機密情報を格納。リポジトリにはコミットしない。
- トークンは開発メモ (`TODO.md`) のみに記載し、公開リポジトリには push しない想定。

### 9. 開発・実行手順（概要）
- [X] Supabase CLI インストール
- [X] `supabase init` & `supabase start` でローカル環境起動
- [X] マイグレーションファイルで `pokemons` テーブル作成
- [X] スクリプト実行 `npm run fetch`
- [X] MCP の設定 (`supabase mcp init` → `supabase mcp dev`)
- [X] Cursor から自然言語検索をテスト

### 10. ローカル開発環境での注意点
- **DockerとSupabase CLI**: ローカル開発には Docker Desktop 及び Supabase CLI が必須です。各ツールが正しくインストールされ、PATHが通っていることを確認してください。
- **ポート競合**: `supabase start` 時にポートが競合するエラーが発生した場合、`supabase/config.toml` 内のポート番号を調整するか、競合する既存のサービスを停止してください。
- **ローカルMCPサーバー**: Cursor等のMCPクライアントからローカルDBに接続する場合、別途ターミナルで `@modelcontextprotocol/server-postgres` サーバーを起動し、正しいDB接続URLを指定する必要があります。
  ```bash
  # DB URLは supabase status で確認
  npx -y @modelcontextprotocol/server-postgres postgresql://postgres:postgres@YOUR_IP:YOUR_DB_PORT/postgres
  ```
- **機密情報**: `.env` ファイルや `TODO.md` に記載した実際のAPIキーやトークンは、Gitリポジトリにコミットしないよう `.gitignore` で適切に管理してください。サンプルファイル (`.env.sample`, `mcp.json.sample`) を活用し、実際の値はローカルでのみ使用します。

以上
