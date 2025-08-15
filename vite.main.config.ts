import { defineConfig } from 'vite'
import { builtinModules } from 'node:module'
import path from 'node:path'

export default defineConfig({
    build: {
        sourcemap: true,
        // outDir: ".vite/build/", // Output directory set to .vite
        // lib: {
        //   entry: "src/main.ts",
        //   formats: ["cjs"],
        // },
        rollupOptions: {
            external: ['electron', ...builtinModules, 'stun'],
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
