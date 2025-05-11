import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY が .env に設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

const WIKI_URL =
  'https://wiki.xn--rckteqa2e.com/wiki/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E4%B8%80%E8%A6%A7';

interface PokemonData {
  national_no: number;
  name_ja: string;
  type_1: string;
  type_2: string | null;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function parsePokemons(html: string, startNo: number, endNo: number, limit: number): PokemonData[] {
  const $ = cheerio.load(html);
  const rows = $(
    'table.sortable tbody tr' // general selection; adjust based on wiki structure
  );
  const pokemonsMap = new Map<number, PokemonData>(); // national_no をキーとしてポケモンデータを一時保存

  rows.each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length < 3) return; 

    const nationalStr = $(cells[0]).text().trim();
    const current_national_no = parseInt(nationalStr, 10);

    if (current_national_no === 6) {
      const debug_name = $(cells[1]).text().trim();
      const debug_type1 = $(cells[2]).text().trim();
      let debug_type2: string | null = null;
      if (cells.length >= 4) {
        const t2 = $(cells[3]).text().trim();
        debug_type2 = t2 || null;
      }
      console.log(`[DEBUG parsePokemons national_no=6] Raw - Name: ${debug_name}, Type1: ${debug_type1}, Type2: ${debug_type2}`);
    }

    if (!isNaN(current_national_no) && current_national_no >= startNo && current_national_no <= endNo) {
      let name_ja_original = $(cells[1]).text().trim(); // オリジナルの名前を保持
      let type_1 = $(cells[2]).text().trim();
      let type_2: string | null = null;
      if (cells.length >= 4) {
        const t2 = $(cells[3]).text().trim();
        type_2 = t2 || null;
      }

      let name_to_register = name_ja_original.split('(')[0].trim(); // 基本名 (例: リザードン)

      if (current_national_no === 6) {
        // メガリザードンXの場合、タイプを優先して設定
        if (name_ja_original.includes('(メガリザードンX)')) {
          console.log(`[INFO] Mega Charizard X detected. Setting its types.`);
          // 既にMapにリザードンXの情報がある場合でも上書きする (問題ないはず)
          pokemonsMap.set(current_national_no, {
            national_no: current_national_no,
            name_ja: 'リザードン', 
            type_1: 'ほのお',
            type_2: 'ドラゴン'
          });
        } else {
          // メガリザードンX以外のリザードン (基本形、メガYなど)
          // Mapにまだ登録されていないか、または登録されていてもそれがメガリザードンXでなければ登録/上書き
          const existingEntry = pokemonsMap.get(current_national_no);
          if (!existingEntry || existingEntry.type_2 !== 'ドラゴン') { // メガX(type_2がドラゴン)でなければ上書きOK
            console.log(`[INFO] Charizard form (${name_ja_original}) detected. Adding/Updating if not MegaX.`);
            pokemonsMap.set(current_national_no, {
              national_no: current_national_no,
              name_ja: 'リザードン',
              type_1: type_1, // そのフォルムのタイプ1
              type_2: type_2  // そのフォルムのタイプ2
            });
          }
        }
      } else {
        // リザードン以外のポケモン
        if (!pokemonsMap.has(current_national_no)) {
          pokemonsMap.set(current_national_no, { 
            national_no: current_national_no, 
            name_ja: name_to_register, // 括弧書き除去した名前
            type_1, 
            type_2 
          });
        }
      }
    }
  });

  const finalPokemons: PokemonData[] = [];
  for (const [key, value] of pokemonsMap) {
    if (finalPokemons.length < limit && key >= startNo && key <= endNo) {
      finalPokemons.push(value);
    }
    if (finalPokemons.length >= limit && key > endNo && !(startNo === endNo) ) break; 
  }
  finalPokemons.sort((a,b) => a.national_no - b.national_no);
  // slice(0, limit) は、startNo === endNo の場合に正しく動作しない可能性があるので、
  // limit 件数を超えないようにループ側で制御し、ここではそのまま返すか、より安全な制御を検討。
  // 今回は fetchDataForRange 側で limit 件数分のループになっている想定だが、parsePokemons側でもケアする。
  return finalPokemons.length > limit && !(startNo === endNo && limit > 1) ? finalPokemons.slice(0, limit) : finalPokemons;
}

async function fetchDataForRange(startNo: number, endNo: number, limit: number) {
  console.log(`Fetching HTML for Pokémon numbers ${startNo}-${endNo} (limit ${limit})...`);
  const html = await fetchHtml(WIKI_URL);
  console.log('Parsing Pokémons...');
  const pokemonsInRange = parsePokemons(html, startNo, endNo, limit);
  console.log(`Parsed ${pokemonsInRange.length} pokemons in range ${startNo}-${endNo}.`);

  if (pokemonsInRange.length > 0) {
    console.log('Upserting into Supabase...');
    // 重複を排除 (念のため。parsePokemons内でseenInThisFetchにより大部分は防がれるはず)
    const uniquePokemons = [...new Map(pokemonsInRange.map(p => [p.national_no, p])).values()];
    console.log(`Upserting ${uniquePokemons.length} unique pokemons.`);

    const { data, error } = await supabase.from('pokemons').upsert(uniquePokemons, {
      onConflict: 'national_no',
      ignoreDuplicates: true, // national_noが重複していてもエラーにせず無視する
    });

    if (error) {
      console.error('Error upserting:', error);
      // process.exit(1); // エラーがあっても次の範囲の処理を続けたい場合はコメントアウト
    } else {
      console.log('Upsert successful.');
    }
  } else {
    console.log('No new pokemons found to upsert in this range.');
  }
}

async function main() {
  // --- 初期データ(1-200)取得 ---
  console.log('Fetching initial Pokémons (1-200)...');
  await fetchDataForRange(1, 200, 200);

  // --- 追加データ(201-400)取得 ---
  console.log('\nFetching additional Pokémons (201-400)...');
  await fetchDataForRange(201, 400, 200);

  console.log('\nAll fetching processes done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 