/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0B0F1A',
        'bg-secondary': '#151B2B',
        'bg-card': '#1E2436',
        'accent-primary': '#8B5CF6',
        'accent-secondary': '#3B82F6',
        'accent-warning': '#F97316',
        'accent-danger': '#EF4444',
        'accent-success': '#22C55E',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      fontFamily: {
        'sans': ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
