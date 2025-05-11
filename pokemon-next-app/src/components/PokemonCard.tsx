import React from 'react';
import { PokemonType } from '@/types'; // エイリアスパスを確認

interface PokemonCardProps {
  pokemon: PokemonType;
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <div className="border border-border rounded-xl p-5 bg-background shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col justify-between h-full min-h-[180px]">
      <div>
        <p className="text-xs text-muted font-mono tracking-wider">No. {String(pokemon.national_no).padStart(4, '0')}</p>
        <h3 className="text-2xl font-bold text-foreground mt-1 mb-3 break-words leading-tight">
          {pokemon.name_ja}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto pt-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ getTypeStyles(pokemon.type_1).bgColor } ${ getTypeStyles(pokemon.type_1).textColor } shadow-sm`}
        >
          {pokemon.type_1}
        </span>
        {pokemon.type_2 && (
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ getTypeStyles(pokemon.type_2).bgColor } ${ getTypeStyles(pokemon.type_2).textColor } shadow-sm`}
          >
            {pokemon.type_2}
          </span>
        )}
      </div>
    </div>
  );
}

// タイプに応じたスタイルを返すヘルパー関数
// モダンな白黒テーマに合わせて調整
// 基本は濃いグレー背景に白文字。アクセントとして少し色味を変えても良いが、今回は統一感を重視。
const getTypeStyles = (type: string): { bgColor: string; textColor: string } => {
  return {
    bgColor: 'bg-gray-700 hover:bg-gray-600', // 濃いグレー、ホバーで少し明るく
    textColor: 'text-white',
  };
  /* 参考：タイプ毎に微妙にグレーの濃淡を変える場合の例
  switch (type.toLowerCase()) {
    case 'ノーマル': return { bgColor: 'bg-gray-600', textColor: 'text-white' };
    case 'ほのお': return { bgColor: 'bg-neutral-700', textColor: 'text-white' }; // 赤の代わりに濃いニュートラル
    case 'みず': return { bgColor: 'bg-slate-700', textColor: 'text-white' };   // 青の代わりに濃いスレート
    // ... 他のタイプも同様に定義 ...
    default:
      return { bgColor: 'bg-gray-700', textColor: 'text-white' };
  }
  */
}; 