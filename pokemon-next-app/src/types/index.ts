export interface PokemonType {
  national_no: number;
  name_ja: string;
  type_1: string;
  type_2: string | null;
  // 必要に応じて他のフィールドも追加 (例: inserted_at, id)
} 