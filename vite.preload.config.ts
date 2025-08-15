import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'
import path from 'node:path'

export default defineConfig({
    build: {
        sourcemap: true,
        // outDir: ".vite/preload", // Output directory set to .vite
        emptyOutDir: true,
        lib: {
            entry: 'src/preload.ts',
            formats: ['cjs'],
        },
        rollupOptions: {
            external: ['electron', ...builtinModules],
            output: {
                entryFileNames: '[name].js',
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@frontend': path.resolve(__dirname, 'src/front-end'),
            '@features': path.resolve(__dirname, 'src/front-end/features'),
        },
    },
})
