import {
    Outlet,
    RouterProvider,
    createRouter,
    createRoute,
    createRootRoute,
    createMemoryHistory,
} from '@tanstack/react-router'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { ColorModeProvider, ColorModeButton } from './components/chakra/ui/color-mode'
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

const routeTree = rootRoute.addChildren([
    indexRoute,
    homeRoute,
    settingsRoute,
    lobbyRoute,
    labRoute,
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
