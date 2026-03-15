/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "rgb(var(--background) / <alpha-value>)",
                surface: "rgb(var(--surface) / <alpha-value>)",
                primary: "rgb(var(--primary) / <alpha-value>)",
                secondary: "rgb(var(--secondary) / <alpha-value>)",
                accent: "rgb(var(--accent) / <alpha-value>)",
                text: {
                    main: "var(--text-main)",
                    muted: "var(--text-muted)",
                },
                border: "var(--border)",
            },
            backdropBlur: {
                xs: '2px',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                heading: ['var(--font-heading)', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
