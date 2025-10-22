/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F8FAFC',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        background: '#FFFFFF',
        foreground: '#0F172A',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#3B82F6',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
