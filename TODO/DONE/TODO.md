## TODO (全工程一覧)

> Supabase Token: `sbp_7dfb1cf0a192385e3a39f0b86f316ddf7eda20d6`
> Supabase Token: `your_supabase_personal_access_token`
>
> ※ 機密情報のため、公開リポジトリへ push しないこと。

---

### 🟢 フェーズ 1: Supabase で Pokemon DB を構築

1. [X] Supabase CLI をインストール
   ```bash
   npm install -g supabase
   ```
2. [X] プロジェクト初期化
   ```bash
   supabase init
   ```
3. [X] ローカルコンテナ起動
   ```bash
   supabase start
   ```
4. [X] pokemons テーブルのマイグレーション作成
   ```bash
   supabase migration new create_pokemons_table
   # ファイルを編集して以下を追加
   -- up.sql
   create table pokemons (
     id bigserial primary key,
     national_no integer unique not null,
     name_ja text not null,
     type_1 text not null,
     type_2 text,
     inserted_at timestamptz default now()
   );
   
   -- down.sql
   drop table if exists pokemons;
   ```
5. [X] マイグレーション適用
   ```bash
   supabase db reset  # 初回のみ
   supabase db push   # 変更分適用
   ```
6. [X] RLS ポリシー設定（read-only 公開）
   ```bash
   supabase gen policy 'Enable read for all' on pokemons for select using ( true );
   ```

### 🟢 フェーズ 2: 200 体のポケモンを取得 & インサート

1. [X] Node.js プロジェクト初期化
   ```bash
   npm init -y
   npm i typescript ts-node @supabase/supabase-js cheerio node-fetch@^3.3 @types/node -D
   npx tsc --init
   ```
2. [X] `scripts/fetch_pokemons.ts` を作成
   - Wiki URL: https://wiki.xn--rckteqa2e.com/wiki/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E4%B8%80%E8%A6%A7
   - 1〜200 行の名前・タイプ1・タイプ2 を抽出
   - `supabase.from('pokemons').upsert([...])` で保存
3. [X] `.env` を作成し、以下を書き込む
   ```env
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=sbp_7dfb1cf0a192385e3a39f0b86f316ddf7eda20d6
   ```
4. [X] スクリプト実行
   ```bash
   npx ts-node scripts/fetch_pokemons.ts
   ```
5. [X] データ件数確認 (200 件)
   ```bash
   supabase sql "select count(*) from pokemons;"
   ```

### 🟢 フェーズ 3: MCP を導入し自然言語検索

1. [X] MCP 初期化
   ```bash
   supabase mcp init
   ```
2. [X] `mcp/config.yaml` を編集
   ```yaml
   version: 1
   provider: openai
   model: gpt-4o
   prompt_template: |
     あなたは SQL アナリストです。以下のユーザクエリを適切な SQL に変換してください。
     {input}
   ```
3. [X] MCP 開発サーバ起動
   ```bash
   supabase mcp dev
   ```
4. [X] Cursor から自然言語クエリを実行

---

### 💡 ローカル開発・MCPテスト時のポイント
- **Docker Desktop の起動**: `supabase start` を実行する前に、Docker Desktop が起動していることを確認してください。
- **MCPサーバーの起動**: CursorでMCPを利用する前に、ターミナルでローカルDB用のMCPサーバーを起動します。DBのURLは `supabase status` で確認できます。
  ```bash
  # 例: npx -y @modelcontextprotocol/server-postgres postgresql://postgres:postgres@127.0.0.1:54322/postgres
  npx -y @modelcontextprotocol/server-postgres YOUR_LOCAL_DB_URL
  ```
- **CursorのMCP設定**: `.cursor/mcp.json` で `supabase-local-postgres` サーバーが正しく設定されているか確認し、CursorのMCP設定で有効化します。必要に応じてCursorを再起動してください。
- **プロンプトの具体性**: MCP (LLM) が解釈しやすいように、具体的で明確なプロンプトを心がけると、期待するSQLが生成されやすくなります。

### ✅ MCP呼び出しプロンプト例 (Cursor Agentモード)
- 「`pokemons` テーブルから全てのポケモンを教えて」
- 「`pokemons` テーブルで `name_ja` が「フシギダネ」のレコードを教えて」
- 「`pokemons` テーブルで `type_1` が「ほのお」のポケモンを教えて」
- 「`pokemons` テーブルから `national_no` が7のポケモンは何？」
- 「`pokemons` テーブルで `type_1` が「どく」かつ `type_2` が「ひこう」のポケモンを教えてください」
- 「`pokemons` テーブルで `name_ja` に「ドン」が含まれるポケモンは？」
- 「`pokemons` テーブルのスキーマ情報を教えて」 (テーブル構造の確認)

### チェックリスト
- [X] Supabase CLI が動作する
- [X] pokemons テーブル作成済み
- [X] 200 件のデータが挿入済み
- [X] MCP から SQL が生成される
- [X] Cursor で結果を確認

---

### 参考
- Supabase MCP ドキュメント: https://supabase.com/docs/guides/getting-started/mcp
- Supabase MCP Server (ローカルPostgres用): https://github.com/model-context-protocol/mcp-server-postgres
- Supabase GitHub リポジトリ: https://github.com/supabase/supabase
- ポケモン一覧: https://wiki.xn--rckteqa2e.com/wiki/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E4%B8%80%E8%A6%A7
