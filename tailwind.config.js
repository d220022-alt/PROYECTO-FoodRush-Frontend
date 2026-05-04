/*
  Guia rapida para presentar:
  Paleta y extensiones de Tailwind. De aqui salen colores de marca como el naranja de FoodRush.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50:  '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
            },
        },
    },
    plugins: [],
}
