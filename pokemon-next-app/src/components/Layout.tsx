import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <header className="p-4 border-b border-border shadow-sm">
        <h1 className="text-3xl font-bold text-center text-gray-800">ポケモン簡易図鑑</h1>
      </header>
      <main className="flex-grow container mx-auto p-6 md:p-8 w-full">
        {children}
      </main>
      <footer className="p-6 mt-10 border-t border-border text-center text-xs text-muted">
        © 2025 Bonginkan Pokemon MCP
      </footer>
    </div>
  );
} 