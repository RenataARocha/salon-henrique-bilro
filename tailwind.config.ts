import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}', // Adiciona src também
    ],
    theme: {
        extend: {
            fontFamily: {
                playfair: ['var(--font-playfair)'],
                lato: ['var(--font-lato)'],

                colors: {
                    gold: {
                        500: '#D4AF37',
                        600: '#B8960F',
                        700: '#9C7E0A',
                    }
                }
            }
        },
    },
    plugins: [],
}
export default config