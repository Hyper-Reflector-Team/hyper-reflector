import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        sourcemap: true,
        // outDir: ".vite/renderer", // Output directory set to .vite
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@frontend': path.resolve(__dirname, 'src/front-end'),
            '@features': path.resolve(__dirname, 'src/front-end/features'),
        },
    },
})
