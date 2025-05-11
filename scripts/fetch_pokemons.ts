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

interface PokemonRow {
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

function parsePokemons(html: string): PokemonRow[] {
  const $ = cheerio.load(html);
  const rows = $(
    'table.sortable tbody tr' // general selection; adjust based on wiki structure
  );
  const pokemons: PokemonRow[] = [];
  const seen = new Set<number>();
  rows.each((i, el) => {
    const cells = $(el).find('td');
    const nationalStr = $(cells[0]).text().trim();
    const national_no = parseInt(nationalStr, 10);
    const name_ja = $(cells[1]).text().trim();
    const type_1 = $(cells[2]).text().trim();
    let type_2: string | null = null;
    if (cells.length >= 4) {
      const t2 = $(cells[3]).text().trim();
      type_2 = t2 || null;
    }
    if (!isNaN(national_no) && !seen.has(national_no)) {
      pokemons.push({ national_no, name_ja, type_1, type_2 });
      seen.add(national_no);
      if (pokemons.length >= 200) return false; // gathered 200 unique
    }
  });
  return pokemons;
}

async function main() {
  console.log('Fetching HTML...');
  const html = await fetchHtml(WIKI_URL);
  console.log('Parsing Pokémons...');
  const pokemons = parsePokemons(html);
  console.log(`Parsed ${pokemons.length} pokemons`);

  // national_no 重複を排除
  const unique = [...new Map(pokemons.map(p => [p.national_no, p])).values()];
  console.log(`Unique ${unique.length} pokemons`);

  console.log('Upserting into Supabase...');
  const { error } = await supabase.from('pokemons').upsert(unique, {
    onConflict: 'national_no',
  });
  if (error) {
    console.error('Error upserting:', error);
    process.exit(1);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 