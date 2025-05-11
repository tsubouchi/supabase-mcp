# Pokemon MCP サンプルプロジェクト

このリポジトリは **Supabase** と **Model Context Protocol (MCP)** を活用し、ローカル環境でポケモン図鑑（全国図鑑番号 0001〜0400）のデータベースを構築し、Cursor IDE などの MCP 対応クライアントから自然言語でポケモンを検索できるデモアプリです。

---

## 目次
1. [概要](#概要)
2. [主な機能](#主な機能)
3. [セットアップ](#セットアップ)
4. [MCP サーバの設定](#mcp-サーバの設定)
5. [使い方](#使い方)
6. [サンプルクエリ](#サンプルクエリ)
7. [ディレクトリ構成](#ディレクトリ構成)
8. [ライセンス](#ライセンス)

---

## 概要
- Supabase CLI を使ってローカルに Postgres + 各種サービスを起動します。
- スクレイピングスクリプト (`scripts/fetch_pokemons.ts`) がポケモン Wiki からデータを取得し、`pokemons` テーブルに現在 400 件の行を保存します。(初期 1-200、追加 201-400)
- `public.pokemons` テーブルは RLS で **read-only** 公開設定。
- MCP サーバ (`@modelcontextprotocol/server-postgres` または `@supabase/mcp-server-supabase`) を起動し、Cursor IDE などから自然言語→SQL 変換を行います。

### データ収集と正確性について
本プロジェクトでは、ポケモンデータをポケモンWikiから自動収集しています。データ収集スクリプト (`scripts/fetch_pokemons.ts`) は、特に複数のフォルムが存在し、フォルムによってタイプが異なるポケモン（例：メガリザードンXは「ほのお・ドラゴン」タイプ）について、その代表的な情報がデータベースに正しく反映されるように調整されています。初期の実装では一部のフォルムのタイプ情報が正確に取得できない課題がありましたが、パーサーロジックを改善し、より正確なデータが格納されるようになっています。このデータ精度向上のためのデバッグプロセスと具体的な修正内容については、`DEBUG_TODO.md` に詳細が記録されています。

## 主な機能
| # | 機能 | 説明 |
|---|------|------|
| 1 | ポケモンデータ取得 | 0001〜0400 番のポケモンを自動取得し DB に保存 |
| 2 | REST / RPC / GraphQL | Supabase 標準 API でデータ参照可能 |
| 3 | RLS | 全ユーザ読み取り可・書込み不可 |
| 4 | MCP 連携 | 自然言語クエリを SQL に変換し、DB を検索 |
| 5 | Cursor Agent | Cursor IDE からチャット形式で検索結果を表示 |

## セットアップ
```bash
# 1. リポジトリ取得
git clone https://github.com/yourname/pokemon-mcp.git
cd pokemon-mcp

# 2. 依存パッケージ
npm install

# 3. Supabase CLI（Homebrew 推奨）
brew install supabase/tap/supabase

# 4. Supabase 初期化 & 起動
supabase init
supabase start

# 5. マイグレーションと RLS 適用
supabase db reset --no-seed

# 6. .env を用意
cp .env.sample .env  # トークンを書き換える

# 7. ポケモンデータ投入
# 初期データ(1-200)と追加データ(201-400)をまとめて取得・登録するようになっています。
# スクリプト内の main 関数で取得範囲を調整可能です。
npx ts-node scripts/fetch_pokemons.ts
```

### ローカル開発時の注意点
- **Docker Desktop の起動**: `supabase start` を実行する前に、Docker Desktop が起動していることを確認してください。
- **Supabase コンテナ**: `supabase start` 後、コンテナが正常に起動しているか `docker ps` で確認できます。`supabase status` で各サービスの URL やキーも確認してください。
- **ポート衝突**: もし `supabase start` でポート関連のエラーが出る場合は、`supabase/config.toml` で各サービスのポート番号を変更するか、既存のプロセスを停止してください (例: `supabase stop --project-id <other_project>` )。

## MCP サーバの設定
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
1. Cursor を開き、**Agent モード**に切替。
2. チャット欄に自然言語で質問を入力。
3. MCP が SQL を生成し、Supabase にクエリ → 結果を表示。

## サンプルクエリ
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
├─ supabase/             # Supabase 設定 & マイグレーション
│  ├─ migrations/
│  └─ config.toml
├─ scripts/
│  └─ fetch_pokemons.ts  # データ取得スクリプト
├─ .cursor/              # MCP 設定
│  └─ mcp.json.sample
├─ .env.sample           # 環境変数テンプレ
├─ TODO.md               # 工程表
├─ basic_design.md       # 設計書
└─ README.md             # 本ファイル
```

## ライセンス
MIT License
