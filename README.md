# Pokemon MCP サンプルプロジェクト

このリポジトリは **Supabase** と **Model Context Protocol (MCP)** を活用し、ローカル環境でポケモン図鑑（全国図鑑番号 0001〜0200）のデータベースを構築し、Cursor IDE などの MCP 対応クライアントから自然言語でポケモンを検索できるデモアプリです。

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
- スクレイピングスクリプト (`scripts/fetch_pokemons.ts`) がポケモン Wiki からデータを取得し、`pokemons` テーブルに 200 件の行を保存します。
- `public.pokemons` テーブルは RLS で **read-only** 公開設定。
- MCP サーバ (`@supabase/mcp-server-supabase`) を起動し、Cursor IDE などから自然言語→SQL 変換を行います。

## 主な機能
| # | 機能 | 説明 |
|---|------|------|
| 1 | ポケモンデータ取得 | 0001〜0200 番のポケモンを自動取得し DB に保存 |
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
npx ts-node scripts/fetch_pokemons.ts
```

## MCP サーバの設定
1. **Personal Access Token (PAT)** を [Supabase ダッシュボード](https://app.supabase.com/) で作成。
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
    }
  }
}
```

## 使い方
1. Cursor を開き、**Agent モード**に切替。
2. チャット欄に自然言語で質問を入力。
3. MCP が SQL を生成し、Supabase にクエリ → 結果を表示。

## サンプルクエリ
| 自然言語 | 生成 SQL (例) |
|----------|---------------|
| 「どく/くさタイプのポケモンを教えて」 | `SELECT * FROM pokemons WHERE type_1 = 'くさ' AND type_2 = 'どく';` |
| 「図鑑番号が 150 以下のエスパータイプを出して」 | `SELECT national_no, name_ja FROM pokemons WHERE national_no <= 150 AND (type_1='エスパー' OR type_2='エスパー');` |

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
