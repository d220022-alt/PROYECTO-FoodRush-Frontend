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
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/foodrush-icon.svg" />
    <link rel="apple-touch-icon" href="/foodrush-icon.svg" />
    <meta name="theme-color" content="#1a1a2e" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="FoodRush conecta clientes con franquicias de comida, carrito, pago, checkout, soporte y seguimiento de pedidos en tiempo real." />
    <link rel="preconnect" href="https://images.unsplash.com" crossorigin>
    <link rel="preconnect" href="https://proyecto-foodrush.onrender.com" crossorigin>
    <link rel="preconnect" href="https://fxapi.app" crossorigin>
    <link rel="dns-prefetch" href="https://images.unsplash.com">
    <link rel="dns-prefetch" href="https://proyecto-foodrush.onrender.com">
    <link rel="dns-prefetch" href="https://fxapi.app">
    <title>FoodRush | Tu Comida Favorita</title>
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
            const pathName = (req.url || '/').split('?')[0]
            const acceptsHtml = String(req.headers.accept || '').includes('text/html')
            const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathName)

            if (pathName !== '/' && pathName !== '/index.html' && (hasFileExtension || !acceptsHtml)) {
                next()
                return
            }

            const html = await server.transformIndexHtml(pathName, buildHtml())
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
        })
    },
    generateBundle(_, bundle) {
        const entryChunk = Object.values(bundle).find((item) => item.type === 'chunk' && item.isEntry)
        const entryCssFiles = new Set(entryChunk?.viteMetadata?.importedCss || [])
        const cssFiles = Object.values(bundle)
            .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
            .filter((item) => entryCssFiles.has(item.fileName))
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
