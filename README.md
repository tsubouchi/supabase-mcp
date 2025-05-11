# Pokemon MCP サンプルプロジェクト

このリポジトリは **Supabase** と **Model Context Protocol (MCP)** を活用し、ローカル環境でポケモン図鑑（全国図鑑番号 0001〜0400）のデータベースを構築するバックエンド機能と、そのデータを検索・表示する **Next.js Webアプリケーション** を含みます。MCP対応クライアント (Cursor IDE等) からの自然言語検索に加え、Webアプリ上でもポケモンを検索できます。

---

## 目次
1. [概要](#概要)
2. [主な機能](#主な機能)
3. [バックエンドセットアップ (Supabase & データ投入)](#バックエンドセットアップ-supabase--データ投入)
4. [フロントエンドセットアップ (Next.js Webアプリ)](#フロントエンドセットアップ-nextjs-webアプリ)
5. [MCP サーバの設定 (Cursor等での利用)](#mcp-サーバの設定-cursor等での利用)
6. [使い方](#使い方)
7. [サンプルクエリ (MCP向け)](#サンプルクエリ-mcp向け)
8. [ディレクトリ構成](#ディレクトリ構成)
9. [ライセンス](#ライセンス)

---

## 概要
- **バックエンド**: Supabase CLI を使用し、ローカルにPostgresデータベースと各種サービスを構築。ポケモンWikiから収集したデータ (1～400番) を格納。
- **フロントエンド**: Next.js (App Router) で構築されたSPA。ユーザーがテキスト入力でポケモンを検索し、結果を一覧表示。
- **データ連携**: Next.jsアプリは、バックエンドAPI (Route Handler) を通じてSupabaseのDBにアクセス。
- **MCP連携**: Cursor IDEなどのMCPクライアントからも、設定を行えばローカルDBに自然言語でクエリ可能。

### データ収集と正確性について
本プロジェクトでは、ポケモンデータをポケモンWikiから自動収集しています。データ収集スクリプト (`scripts/fetch_pokemons.ts`) は、特に複数のフォルムが存在し、フォルムによってタイプが異なるポケモン（例：メガリザードンXは「ほのお・ドラゴン」タイプ）について、その代表的な情報がデータベースに正しく反映されるように調整されています。初期の実装では一部のフォルムのタイプ情報が正確に取得できない課題がありましたが、パーサーロジックを改善し、より正確なデータが格納されるようになっています。このデータ精度向上のためのデバッグプロセスと具体的な修正内容については、`DEBUG_TODO.md` に詳細が記録されています。

## 主な機能
| # | 機能 | 説明 |
|---|------|------|
| 1 | ポケモンデータ取得 | 0001〜0400 番のポケモンを自動取得し DB に保存 |
| 2 | REST / RPC / GraphQL | Supabase 標準 API でデータ参照可能 (バックエンド) |
| 3 | RLS | 全ユーザ読み取り可・書込み不可 (DB設定) |
| 4 | MCP 連携 | 自然言語クエリを SQL に変換し、DB を検索 (Cursor等) |
| 5 | Webアプリ検索 | Next.jsアプリ上でキーワード検索し、ポケモン情報を表示 |

## バックエンドセットアップ (Supabase & データ投入)
```bash
# (リポジトリルートで実行)
# 1. リポジトリ取得 (済んでいれば不要)
# git clone https://github.com/yourname/pokemon-mcp.git
# cd pokemon-mcp

# 2. 依存パッケージ (データ取得スクリプト用)
npm install

# 3. Supabase CLI（Homebrew 推奨）
brew install supabase/tap/supabase

# 4. Supabase 初期化 & 起動
supabase init
supabase start # Docker Desktopが起動していることを確認

# 5. マイグレーションと RLS 適用
supabase db reset --no-seed

# 6. .env を用意 (データ取得スクリプト用)
cp .env.sample .env  # SupabaseのService Role Keyを設定

# 7. ポケモンデータ投入
npx ts-node scripts/fetch_pokemons.ts
```

## フロントエンドセットアップ (Next.js Webアプリ)
```bash
# (リポジトリルートから実行)
# 1. Next.js アプリのディレクトリへ移動
cd pokemon-next-app

# 2. 環境変数の設定 (初回のみ)
# .env.local ファイルがまだなければ作成し、ローカルSupabaseの情報を記述
# (通常はプロジェクト作成時に.env.localが雛形として作成されるか、手動で作成)
# 例:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key (supabase statusで確認)
# (このプロジェクトでは既に .env.local が gitignore されており、各自設定する想定)

# 3. 開発サーバー起動
npm run dev
```
ブラウザで `http://localhost:3000` を開くとアプリケーションが表示されます。

### ローカル開発時の注意点 (共通)
- **Docker Desktop の起動**: `supabase start` を実行する前に、Docker Desktop が起動していることを確認してください。
- **Supabase コンテナ**: `supabase start` 後、コンテナが正常に起動しているか `docker ps` で確認できます。`supabase status` で各サービスの URL やキーも確認してください。
- **ポート衝突**: もし `supabase start` でポート関連のエラーが出る場合は、`supabase/config.toml` で各サービスのポート番号を変更するか、既存のプロセスを停止してください (例: `supabase stop --project-id <other_project>` )。

## MCP サーバの設定 (Cursor等での利用)
1. **Personal Access Token (PAT)** を [Supabase ダッシュボード](https://app.supabase.com/) で作成。(Supabase Platform経由の `@supabase/mcp-server-supabase` を利用する場合のみ。ローカルDB用の `@modelcontextprotocol/server-postgres` では不要です。)
2. `.cursor/mcp.json` を作成するか、`.cursor/mcp.json.sample` をコピーし、トークンとプロジェクト ID を記入。
3. Cursor 設定で MCP を有効化すると、ツール欄に Supabase が表示されます。

```jsonc
// .cursor/mcp.json の例
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "your_supabase_access_token",
        "--project-ref",
        "your_project_ref",
        "--read-only"
      ]
    },
    "supabase-local-postgres": { // ローカルDB用 (こちらを主に利用)
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres" // `supabase status` で表示される DB URL
      ]
    }
  }
}
```

**MCPサーバの起動 (ターミナルで実行):**

ローカルDBに接続する場合 (推奨):
```bash
npx -y @modelcontextprotocol/server-postgres postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Supabase Platform経由 (PATが必要なクラウド開発向け):
```bash
npx -y @supabase/mcp-server-supabase@latest --access-token your_supabase_access_token --project-ref your_project_ref --read-only
```
バックグラウンドで起動する場合は末尾に `&` を追加します。

## 使い方
### Webアプリケーション
1.  上記「フロントエンドセットアップ (Next.js Webアプリ)」の手順で開発サーバーを起動します。
2.  ブラウザで `http://localhost:3000` にアクセスします。
3.  検索バーにポケモンの名前（例: ピカチュウ）やタイプ（例: ほのお）を入力し、「検索する」ボタンをクリックします。
4.  検索結果が画面に表示されます。

### MCPクライアント (Cursor Agentなど)
1.  上記「MCP サーバの設定」の手順でMCPサーバーを起動し、Cursorを設定します。
2.  Cursor を開き、**Agent モード**に切替。
3.  チャット欄に自然言語で質問を入力します。
4.  MCP が SQL を生成し、Supabase にクエリ → 結果を表示します。

## サンプルクエリ (MCP向け)
| 自然言語 | 生成 SQL (例) | 想定される結果/アクション |
|----------|---------------|----------------------|
| 「くさタイプのポケモンを一覧して」 | `SELECT * FROM pokemons WHERE type_1 = 'くさ' OR type_2 = 'くさ' ORDER BY national_no;` | フシギダネなど、くさタイプを持つポケモンの一覧 |
| 「フシギダネの情報を教えて」 | `SELECT * FROM pokemons WHERE name_ja = 'フシギダネ';` | フシギダネの詳細情報 (図鑑番号、タイプなど) |
| 「ほのおタイプで、かつドラゴンタイプのポケモンはいる？」 | `SELECT * FROM pokemons WHERE (type_1 = 'ほのお' AND type_2 = 'ドラゴン') OR (type_1 = 'ドラゴン' AND type_2 = 'ほのお');` | リザードン（メガリザードンXのタイプを反映）が表示される |
| 「図鑑番号が10番のポケモンは何？」 | `SELECT * FROM pokemons WHERE national_no = 10;` | キャタピーの情報 |
| 「どくタイプで一番強いポケモンは？ (注:強さの定義不可)」 | `SELECT * FROM pokemons WHERE type_1 = 'どく' OR type_2 = 'どく';` | (LLMが解釈し、どくタイプのポケモンをリストアップ。順序は不定) |
| 「エスパータイプのポケモンを3匹教えて」 | `SELECT * FROM pokemons WHERE type_1 = 'エスパー' OR type_2 = 'エスパー' LIMIT 3;` | エスパータイプのポケモンを3匹表示 |

> **注**: 実際の SQL は LLM によって動的生成されるため多少異なる場合があります。

## ディレクトリ構成
```
/ (プロジェクトルート)
├─ pokemon-next-app/     # Next.js フロントエンドアプリケーション
│  ├─ src/
│  │  ├─ app/           # App Router (APIルート、ページ)
│  │  │  ├─ api/search/route.ts # 検索API
│  │  │  └─ page.tsx         # メインページ
│  │  ├─ components/    # Reactコンポーネント (Layout, SearchBar, PokemonCard, etc.)
│  │  ├─ lib/           # Supabaseクライアント (supabaseClient.ts)
│  │  └─ types/         # 型定義 (index.ts)
│  ├─ public/            # 静的ファイル
│  ├─ .env.local         # 環境変数 (gitignore対象)
│  └─ ... (package.json, tsconfig.json 等)
├─ supabase/             # Supabase 設定 & マイグレーション (バックエンド)
│  ├─ migrations/
│  └─ config.toml
├─ scripts/              # データ取得スクリプト (バックエンド用)
│  └─ fetch_pokemons.ts
├─ .cursor/              # MCP 設定 (Cursor用)
│  ├─ mcp.json
│  └─ mcp.json.sample
├─ .env.sample           # データ取得スクリプト用環境変数サンプル (バックエンド用)
├─ .gitignore            # ルートのgitignore
├─ BASIC_DESIGN.md (旧 basic_design.md)
├─ DATA_ADD_TODO.md
├─ DEBUG_TODO.md
├─ FRONT_TODO.md
├─ TODO.md (旧 全体TODO)
└─ README.md             # 本ファイル
```

## ライセンス
MIT License
