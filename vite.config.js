/*
  Guia rapida para presentar:
  Configuracion de Vite. Mantiene el build rapido y deja lista la app para Vercel.
  Buscar en VS Code: estructura, flujo, UI, datos, presentacion.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const buildHtml = (scriptSrc = '/src/main.js', cssFiles = []) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/foodrush-icon.svg" />
    <link rel="apple-touch-icon" href="/foodrush-icon.svg" />
    <meta name="theme-color" content="#BD0A0A" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FoodRush | Tu Comida Favorita</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Titan+One&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    ${cssFiles.map((fileName) => `<link rel="stylesheet" href="/${fileName}">`).join('\n    ')}
</head>
<body>
    <div id="app"></div>
    <script type="module" src="${scriptSrc}"></script>
</body>
</html>
`

const virtualHtmlEntry = () => ({
    name: 'foodrush-virtual-html-entry',
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            if (req.url !== '/' && req.url !== '/index.html') {
                next()
                return
            }

            const html = await server.transformIndexHtml(req.url, buildHtml())
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
        })
    },
    generateBundle(_, bundle) {
        const entryChunk = Object.values(bundle).find((item) => item.type === 'chunk' && item.isEntry)
        const cssFiles = Object.values(bundle)
            .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
            .map((item) => item.fileName)

        this.emitFile({
            type: 'asset',
            fileName: 'index.html',
            source: buildHtml(`/${entryChunk.fileName}`, cssFiles),
        })
    },
})

// https://vitejs.dev/config/
export default defineConfig({
    appType: 'custom',
    plugins: [vue(), virtualHtmlEntry()],
    build: {
        rollupOptions: {
            input: path.resolve(__dirname, './src/main.js'),
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
