import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // デフォルトのsans-serifをInterに変更
      },
      // 白黒テーマに合わせたカラースキーム（任意で拡張）
      colors: {
        background: '#ffffff', // 白
        foreground: '#111827', // やや濃いグレー（黒に近い）
        primary: '#374151',    // ボタンなどの主要色 (濃いグレー)
        secondary: '#6b7280',  // やや薄いグレー
        accent: '#4b5563',     // アクセント色 (中間グレー)
        muted: '#9ca3af',      // 薄いグレー（補助テキストなど）
        border: '#e5e7eb',     // ボーダー色 (非常に薄いグレー)
      },
      // 必要であれば他の拡張もここに追加
    },
  },
  plugins: [],
}
export default config 