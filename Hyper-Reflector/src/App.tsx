import { useState } from 'react'
import reactLogo from './assets/react.svg'
import { invoke } from '@tauri-apps/api/core'
import theme from './utils/theme'
import { Command } from '@tauri-apps/plugin-shell'
import {
    Outlet,
    RouterProvider,
    createRouter,
    createRoute,
    createRootRoute,
    createMemoryHistory,
} from '@tanstack/react-router'
import { ChakraProvider, defaultConfig, defineConfig, createSystem, Box } from '@chakra-ui/react'

import './App.css'

const rootRoute = createRootRoute({
    component: () => (
        <>
            <div>Hey</div>
            {/* <Layout>
                <Toaster />
                <Outlet />
            </Layout> */}
            {/* <TanStackRouterDevtools /> */}
        </>
    ),
})

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: function Home() {
        return <StartPage />
    },
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    // autoLogRoute,
    // newsRoute,
    // offlineRoute,
    // chatRoute,
    // profileRoute,
    // settingsRoute,
    // createAccountRoute,
])

// this allows electron to hash the routing
const memoryHistory = createMemoryHistory({
    initialEntries: ['/auto-login'], // Pass your initial url
})

const router = createRouter({ routeTree, history: memoryHistory })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const config = defineConfig({
    theme: {
        // animationStyles,
    },
})

export const system = createSystem(defaultConfig, config)

function App() {
    const [greetMsg, setGreetMsg] = useState('')
    const [name, setName] = useState('')

    async function greet() {
        console.log(greet)
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        setGreetMsg(await invoke('greet', { name }))
        const full = await invoke('run_custom_process')
        //const command = Command.sidecar('run_custom_process')
        console.log(full)
    }

    return (
        <main className="container">
            <ChakraProvider value={system}>
                <Box backgroundColor={theme.colors.main.bg}>
                    <RouterProvider router={router} />
                </Box>
            </ChakraProvider>
            <h1>Welcome to Tauri + React</h1>

            <div className="row">
                <a href="https://vite.dev" target="_blank">
                    <img src="/vite.svg" className="logo vite" alt="Vite logo" />
                </a>
                <a href="https://tauri.app" target="_blank">
                    <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <p>Click on the Tauri, Vite, and React logos to learn more.</p>

            <form
                className="row"
                onSubmit={(e) => {
                    e.preventDefault()
                    greet()
                }}
            >
                <input
                    id="greet-input"
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name..."
                />
                <button type="submit">Greet</button>
            </form>
            <p>{greetMsg}</p>
        </main>
    )
}

export default App
