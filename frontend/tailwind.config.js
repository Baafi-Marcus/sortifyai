/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0B1120',      // Solid neutral dark
                    surface: '#111827',   // Structural container background
                    border: '#1F2937',    // Crisp structural border
                    primary: '#06B6D4',   // Single primary brand accent (Cyan 500)
                    secondary: '#1E293B', // Neutral slate 800
                    accent: '#0891B2',    // Cyan 600
                }
            },
            borderRadius: {
                DEFAULT: '4px',
                none: '0px',
                sm: '4px',
                md: '8px',
                lg: '8px',
                xl: '8px',
                '2xl': '8px',
                '3xl': '8px',
                full: '9999px', // Restricted to 1:1 circular avatars and status dots
            },
            fontSize: {
                xs: ['12px', { lineHeight: '18px' }],
                sm: ['14px', { lineHeight: '21px' }],
                base: ['16px', { lineHeight: '24px' }],
                lg: ['16px', { lineHeight: '24px' }],
                xl: ['24px', { lineHeight: '28.8px' }],
                '2xl': ['24px', { lineHeight: '28.8px' }],
                '3xl': ['24px', { lineHeight: '28.8px' }],
                '4xl': ['24px', { lineHeight: '28.8px' }],
                '5xl': ['24px', { lineHeight: '28.8px' }],
                '6xl': ['24px', { lineHeight: '28.8px' }],
                '7xl': ['24px', { lineHeight: '28.8px' }],
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            transitionTimingFunction: {
                standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            transitionDuration: {
                fast: '150ms',
                DEFAULT: '150ms',
            },
        },
    },
    plugins: [],
}

