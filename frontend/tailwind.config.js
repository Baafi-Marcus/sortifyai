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
                    dark: '#0f172a', // Slate 900
                    primary: '#06b6d4', // Cyan 500
                    secondary: '#334155', // Slate 700
                    accent: '#22d3ee', // Cyan 400
                }
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
