import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  isLoading: boolean;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isLoading,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoading) {
      handleSearch();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 mb-8 p-6 bg-gray-50 rounded-xl shadow-lg">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="「ピカチュウ」または「でんき」などで検索"
        className="border border-border p-3 rounded-lg w-full sm:flex-grow text-foreground bg-background focus:ring-2 focus:ring-primary outline-none transition-all duration-150 shadow-sm focus:shadow-md"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-muted disabled:cursor-not-allowed transition-colors duration-150 w-full sm:w-auto shadow-md hover:shadow-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : '検索する'}
      </button>
    </form>
  );
} 