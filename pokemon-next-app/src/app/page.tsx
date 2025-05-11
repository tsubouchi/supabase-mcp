"use client"; // クライアントコンポーネントとしてマーク

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import SearchBar from '@/components/SearchBar';
import ResultsDisplay from '@/components/ResultsDisplay';
import { PokemonType } from '@/types';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError(null);
      setSearchAttempted(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchAttempted(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const result = await response.json();
      setSearchResults(result.data || []);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || '検索処理中にエラーが発生しました。');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isLoading={isLoading}
        />
        <ResultsDisplay
          pokemons={searchResults}
          isLoading={isLoading}
          error={error}
          searchAttempted={searchAttempted}
        />
      </div>
    </Layout>
  );
}
