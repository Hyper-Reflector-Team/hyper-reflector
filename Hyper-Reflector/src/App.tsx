import {
    Outlet,
    RouterProvider,
    createRouter,
    createRoute,
    createRootRoute,
    createMemoryHistory,
} from '@tanstack/react-router'
import './i18n'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { ColorModeProvider } from './components/chakra/ui/color-mode'
import theme from './theme'
// import ErrorBoundary from './ErrorBoundary'
import Layout from './layout/Layout'
import { Toaster } from './components/chakra/ui/toaster'
import './App.css'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import LobbyPage from './pages/LobbyPage'
import LabPage from './pages/LabPage'
import { useEffect } from 'react'
import { useSettingsStore } from './state/store'
import { useTranslation } from 'react-i18next'
import ProfilePage from './pages/ProfilePage'
import { resolveResource } from '@tauri-apps/api/path'

const rootRoute = createRootRoute({
    component: () => (
        <>
            <Layout>
                <Toaster />
                <Outlet />
            </Layout>
        </>
    ),
})

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: function Login() {
        return <LoginPage />
    },
})

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/home',
    component: function Home() {
        return <HomePage />
    },
})

const lobbyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/lobby',
    component: function Settings() {
        return <LobbyPage />
    },
})

const labRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/lab',
    component: function Settings() {
        return <LabPage />
    },
})

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: function Settings() {
        return <SettingsPage />
    },
})

const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: function Settings() {
        return <ProfilePage />
    },
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    homeRoute,
    settingsRoute,
    lobbyRoute,
    labRoute,
    profileRoute,
])

// this allows electron to hash the routing
const memoryHistory = createMemoryHistory({
    initialEntries: ['/'],
})

const router = createRouter({ routeTree, history: memoryHistory })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

function App() {
    const { i18n } = useTranslation()
    const appLanguage = useSettingsStore((s) => s.appLanguage)
    // handle language changes and other effects on load
    useEffect(() => {
        i18n.changeLanguage(appLanguage)
        console.log('app loaded as ', appLanguage)
    }, [])

    useEffect(() => {
        async function ensureDefaultEmulatorPath() {
            try {
                const { emulatorPath, setEmulatorPath } = useSettingsStore.getState()
                if (emulatorPath && emulatorPath.trim().length) {
                    return
                }

                if (typeof window !== 'undefined' && '__TAURI__' in window) {
                    try {
                        const resourcePath = await resolveResource('emu/hyper-screw-fbneo/fs-fbneo.exe')
                        if (resourcePath) {
                            setEmulatorPath(resourcePath)
                            return
                        }
                    } catch (error) {
                        console.warn('Failed to resolve bundled emulator path:', error)
                    }
                }

                const fallback = 'emu/hyper-screw-fbneo/fs-fbneo.exe'
                setEmulatorPath(fallback)
            } catch (error) {
                console.error('Failed to ensure default emulator path:', error)
            }
        }

        void ensureDefaultEmulatorPath()
    }, [])

    return (
        <main className="container">
            <ChakraProvider value={theme}>
                <ColorModeProvider>
                    <Box>
                        <RouterProvider router={router} />
                    </Box>
                </ColorModeProvider>
            </ChakraProvider>
        </main>
    )
}

export default App
