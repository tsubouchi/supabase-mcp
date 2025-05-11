import React from 'react';
import { PokemonType } from '@/types';
import PokemonCard from './PokemonCard';

interface ResultsDisplayProps {
  pokemons: PokemonType[];
  isLoading: boolean;
  error: string | null;
  searchAttempted: boolean; // 検索が試みられたかどうかを示すフラグ
}

export default function ResultsDisplay({ pokemons, isLoading, error, searchAttempted }: ResultsDisplayProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg text-muted">検索しています...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-600 bg-red-50 border border-red-200 p-6 rounded-lg shadow-md">エラー: {error}</div>;
  }

  // 検索が試みられた後で、結果が0件の場合
  if (searchAttempted && pokemons.length === 0) {
    return <div className="text-center py-12 text-muted">該当するポケモンは見つかりませんでした。</div>;
  }
  
  // 初期表示時（検索前）は何も表示しない、または「検索してください」のようなメッセージを表示
  if (!searchAttempted && pokemons.length === 0) {
    return <div className="text-center py-12 text-muted italic">ポケモンの名前やタイプを入力して検索を開始してください。</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
      {pokemons.map((pokemon) => (
        <PokemonCard key={pokemon.national_no} pokemon={pokemon} />
      ))}
    </div>
  );
} 