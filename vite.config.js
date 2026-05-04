/*
  Guia rapida para presentar:
  Configuracion de Vite. Mantiene el build rapido y deja lista la app para Vercel.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
