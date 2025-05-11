## 5工程：Webアプリケーション開発 TODO (Next.js App Router SPA)

### 目的
- Next.js (App Router) と TypeScript を用いて、ポケモン図鑑のフロントエンドSPA（シングルページアプリケーション）を構築する。
- ユーザーがテキスト入力でポケモンを検索し、結果を同一ページ内に一覧表示できるようにする。
- デザインは白黒2色を基調とする。

### 画面ワイヤーフレーム (概念)
```
+--------------------------------------------------+
| ヘッダー: ポケモン図鑑 (シンプルテキスト)        |
+--------------------------------------------------+
|                                                  |
| 検索バー: [ テキスト入力エリア      ] [検索ボタン] |
|                                                  |
+--------------------------------------------------+
|                                                  |
| 検索結果表示エリア:                              |
|   +--------------------------------------------+ |
|   | ポケモンカード/リストアイテム 1              | |
|   | (図鑑No, 名前, タイプ1, タイプ2)           | |
|   +--------------------------------------------+ |
|   | ポケモンカード/リストアイテム 2              | |
|   | (図鑑No, 名前, タイプ1, タイプ2)           | |
|   +--------------------------------------------+ |
|   | ... (検索結果に応じて表示)                 | |
|   |                                            | |
|   | (ローディング中/結果なしの場合の表示)        | |
|                                                  |
+--------------------------------------------------+
| フッター: © Your Name or App Name                |
+--------------------------------------------------+
```

### 🟢 フェーズ 5.1: プロジェクトセットアップと基本設定
1.  [X] **Next.jsプロジェクト作成 (App Router, TypeScript, Tailwind CSS)**
    *   コマンド: `npx create-next-app@latest pokemon-next-app --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"`
    *   プロジェクト名: `pokemon-next-app` (ワークスペースルート直下に作成)
2.  [X] **必要なライブラリインストール**
    *   `@supabase/supabase-js`: Supabaseクライアント (`cd pokemon-next-app` してからインストール)
3.  [X] **Supabaseクライアント初期設定**
    *   `pokemon-next-app/src/lib/supabaseClient.ts` にSupabaseクライアントのインスタンスを作成。
4.  [X] **環境変数設定**
    *   `pokemon-next-app/.env.local` ファイルを作成し、SupabaseのURLとAnon Keyを記述。
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   これはローカルSupabase (`supabase start` で起動しているもの) の `API URL` と `anon key` を設定。
5.  [X] **Tailwind CSS 設定確認と白黒テーマ準備**
    *   `pokemon-next-app/tailwind.config.ts` と `pokemon-next-app/src/app/globals.css` を確認。
    *   `globals.css` でbodyの背景色や文字色の基本を白黒に設定。

### 🟢 フェーズ 5.2: バックエンドAPI (Route Handler)
1.  [X] **検索APIルート作成**
    *   `pokemon-next-app/src/app/api/search/route.ts` を作成。
2.  [X] **リクエストハンドラ実装 (POST)**
    *   リクエストボディから検索キーワード (例: `{ query: "リザードン" }`) を受け取る。
    *   キーワードを元に `pokemons` テーブルを検索するSQLクエリを組み立てる。
        *   **検索ロジック**: `name_ja` (部分一致、大文字小文字区別なし)、`type_1` (完全一致)、`type_2` (完全一致) のいずれかにヒットするものをOR条件で検索。`national_no` で昇順ソート。
        *   例: `SELECT * FROM pokemons WHERE name_ja ILIKE '%' || $1 || '%' OR type_1 = $1 OR type_2 = $1 ORDER BY national_no;` (ここで `$1` は検索キーワード)
    *   `src/lib/supabaseClient.ts` を使用してDBにクエリ実行。
    *   結果をJSON形式で返す (例: `NextResponse.json({ data: pokemons })`)。
3.  [X] **エラーハンドリング**
    *   DBエラー発生時は適切なエラーレスポンス (例: 500エラーとエラーメッセージ) を返す。
4.  [X] **CORS設定 (公開時)**
    *   `NextResponse` のヘッダーに `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` を適切に設定する。
    *   `*` もしくは開発/本番の分岐で対応
    *   プリフライトリクエスト (`OPTIONS`) への対応が必要な場合も考慮する。(OPTIONSハンドラを追加済)

### 🟢 フェーズ 5.3: フロントエンドUIコンポーネント開発
(すべて `pokemon-next-app/src/components/` 配下に作成)
1.  [X] **レイアウトコンポーネント: `Layout.tsx`** (任意だが推奨)
    *   ヘッダー（アプリタイトル: "ポケモン簡易図鑑"）、メインコンテンツエリア、フッター（例: "© 2025 Pokemon App"）の骨格。
2.  [X] **検索入力コンポーネント: `SearchBar.tsx`**
    *   `input type="text"` と `button` を含む。
    *   入力値の管理と検索ボタンクリック時の処理は親 (page.tsx) からpropsで受け取る。
3.  [X] **ポケモン情報表示コンポーネント: `PokemonCard.tsx`**
    *   Props: `{ pokemon: PokemonType }` (PokemonTypeは型定義が必要)
    *   図鑑番号、名前、タイプ1、タイプ2を整形して表示。白黒デザイン。
4.  [X] **検索結果リストコンポーネント: `ResultsDisplay.tsx`**
    *   Props: `{ pokemons: PokemonType[], isLoading: boolean, error: string | null }`
    *   `pokemons` 配列をマップして `PokemonCard` を複数表示。
    *   `isLoading` がtrueなら「検索中...」表示。
    *   `error` があればエラーメッセージ表示。
    *   結果が空かつ `isLoading` でなく `error` もなければ「見つかりませんでした」表示。

### 🟢 フェーズ 5.4: メインページ開発 (`pokemon-next-app/src/app/page.tsx`)
1.  [X] **ポケモンデータの型定義**
    *   `PokemonType` (national_no, name_ja, type_1, type_2 を含む) を定義。
2.  [X] **状態管理**
    *   `searchQuery` (string), `searchResults` (PokemonType[]), `isLoading` (boolean), `error` (string | null) を `useState` で管理。
3.  [X] **検索実行関数 `handleSearch`**
    *   `isLoading` を true に設定。
    *   `/api/search` に `fetch` でPOSTリクエスト (ボディに `{ query: searchQuery }`)。
    *   レスポンスをJSONでパースし、`searchResults` を更新。
    *   エラーがあれば `error` を更新。
    *   最後に `isLoading` を false に設定。
4.  [X] **UI構築**
    *   `Layout` を使用。
    *   `SearchBar` を配置し、`searchQuery` と `setSearchQuery`、`handleSearch` を渡す。
    *   `ResultsDisplay` を配置し、`searchResults`, `isLoading`, `error` を渡す。

### 🟢 フェーズ 5.5: スタイリング (白黒2色・モダン)
1.  [X] **グローバルスタイル** (`pokemon-next-app/src/app/globals.css`)
    *   [X] `body` に基本の背景色 (例: `bg-white`) と文字色 (例: `text-black`) を設定。
    *   [X] モダンなフォントの検討と適用 (例: `next/font` を利用して Inter や Manrope などを検討)。(Interを適用済)
2.  [X] **コンポーネントごとのスタイル**
    *   [X] 各コンポーネント (`Layout`, `SearchBar`, `PokemonCard`, `ResultsDisplay`) にTailwindクラスを適用し、ワイヤーフレームに沿った白黒デザインを実現。
    *   [X] 入力フィールド、ボタン、カードの境界線、余白などを調整。
    *   [X] **モダン化調整**:
        *   [X] 全体的な余白（padding, margin）と要素間スペース（gap）の最適化。
        *   [X] 角丸（rounded）とシャドウ（shadow）のバランス調整による洗練された見た目の追求。
        *   [X] ホバーエフェクト、フォーカス時のスタイル変化をよりスムーズかつ明確に。
        *   [X] タイポグラフィ（フォントサイズ、太さ、行間）を調整し、情報の階層と可読性を向上。
        *   [X] 各要素の区切り線（border）をより繊細に（例: `border-gray-200` や `border-neutral-200` など）。

### 🟢 フェーズ 5.6: テストとデバッグ
1.  [ ] `pokemon-next-app` ディレクトリで `npm run dev` を実行し、動作確認。
2.  [ ] 検索機能テスト: 様々なキーワードで検索し、期待通りの結果（該当あり、なし、エラー時）になるか確認。
3.  [ ] 表示テスト: 取得したポケモン情報が正しく表示されるか、レイアウトが崩れていないか確認。

### 🟢 フェーズ 5.7: ドキュメント更新 (任意)
1.  [ ] 親階層の `README.md` に、`pokemon-next-app` のセットアップ方法と起動コマンドを追記。

---

### チェックリスト (フェーズ5)
- [ ] Next.jsプロジェクト(`pokemon-next-app`)が作成され、基本設定が完了している。
- [ ] バックエンドAPI (`/api/search`) がキーワードに基づいてポケモンデータを返せ、CORS設定が考慮されている。
- [ ] UIコンポーネント群が作成され、適切に連携している。
- [ ] メインページで検索入力、API呼び出し、結果表示のSPAとしてのフローが機能する。
- [ ] 全体的に白黒2色を基調としたモダンなデザインが適用されている。
