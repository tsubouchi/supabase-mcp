## データ追加 TODO (フェーズ4: ポケモン 0201～0400 追加)

### 🟢 フェーズ 4: 追加ポケモンデータ (0201～0400) の取得とDB更新

1.  [X] `scripts/fetch_pokemons.ts` の改修
    *   [X] 取得するポケモンの全国図鑑番号の範囲を 201 から 400 に指定できるようにする。
    *   [X] 既存の取得ロジックを参考に、指定範囲のデータを正しくパースできるようにする。
    *   [X] 取得したデータを `pokemons` テーブルに `upsert` する処理を確認する。
2.  [X] 改修したスクリプトの実行
    ```bash
    # 必要に応じて環境変数や引数を設定
    npx ts-node scripts/fetch_pokemons.ts
    ```
    実行結果: `Parsed 200 pokemons in range 201-400.` `Upserting 200 unique pokemons.` `Upsert successful.`
3.  [X] データ件数および内容確認 (DB上で件数が増えていること、201番以降のデータが追加されていること)
    ```bash
    # 例: docker exec supabase_db_pokemon_mcp psql -U postgres -c "SELECT COUNT(*) FROM pokemons;"
    # 例: docker exec supabase_db_pokemon_mcp psql -U postgres -c "SELECT * FROM pokemons WHERE national_no > 200 ORDER BY national_no LIMIT 5;"
    ```
    確認結果:
    - 総件数: 400件
    - 201番以降のデータ例: 201 アンノーン (エスパー), 202 ソーナンス (エスパー), ...

---

### チェックリスト (フェーズ4)
- [X] `fetch_pokemons.ts` が201～400のデータを取得できる。
- [X] スクリプト実行後、DBに該当ポケモンが追加されている。
- [X] 総ポケモン数が約400件になっている (初期データと合わせて)。

---

### 参考URL
- ポケモン一覧 Wiki: https://wiki.xn--rckteqa2e.com/wiki/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E4%B8%80%E8%A6%A7
