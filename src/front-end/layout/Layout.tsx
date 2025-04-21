import { useEffect, useState } from 'react'
import { Stack, Tabs, Box, Text } from '@chakra-ui/react'
import { useNavigate } from '@tanstack/react-router'
import { toaster } from '../components/chakra/ui/toaster'
import { useLayoutStore, useLoginStore, useMessageStore } from '../state/store'
import theme from '../utils/theme'
import { Settings } from 'lucide-react'

export default function Layout({ children }) {
    const [isLoading, setIsLoading] = useState(false)
    const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
    const setUserState = useLoginStore((state) => state.setUserState)
    const user = useLoginStore((state) => state.userState)
    const loggedOut = useLoginStore((state) => state.loggedOut)
    const clearMessageState = useMessageStore((state) => state.clearMessageState)
    const clearUserList = useMessageStore((state) => state.clearUserList)
    const layoutTab = useLayoutStore((state) => state.selectedTab)
    const setLayoutTab = useLayoutStore((state) => state.setSelectedTab)

    const navigate = useNavigate()

    useEffect(() => {
        window.api.on('loggedOutSuccess', (event) => {
            clearUserList()
            clearMessageState()
            setUserState({ email: '' })
            loggedOut()
            setIsLoading(false)
            navigate({ to: '/' })
            // handle do some funky stateful call for logging in redirect etc
        })
    }, [])

    useEffect(() => {
        if (isLoggedIn) {
            // user logged in
            setLayoutTab('chat')
        } else {
            // user logged out
            setLayoutTab('login')
        }
    }, [isLoggedIn])

    const handleAlertFromMain = (alertData) => {
        toaster.error({
            title: alertData?.message?.title,
            description: alertData?.message?.description,
        })
    }

    useEffect(() => {
        window.api.removeExtraListeners('sendAlert', handleAlertFromMain)
        window.api.on('sendAlert', handleAlertFromMain)

        return () => {
            window.api.removeListener('sendAlert', handleAlertFromMain)
        }
    }, [])

    return (
        <Stack minH="100vh" height="100vh">
            <Box
                h="60px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bg={theme.colors.main.secondary}
                px="4"
                flexShrink={0}
            >
                <Tabs.Root variant="enclosed" value={layoutTab} width="100%">
                    <Tabs.List bg={theme.colors.main.secondary} rounded="l3" minW="100%">
                        <Box display={'flex'} width="100%">
                            {!isLoggedIn && (
                                <Tabs.Trigger
                                    width={'100px'}
                                    _selected={{ bg: theme.colors.main.action }}
                                    color={theme.colors.main.text}
                                    value="login"
                                    onClick={() => {
                                        navigate({ to: '/' })
                                        setLayoutTab('login')
                                    }}
                                >
                                    Sign In
                                </Tabs.Trigger>
                            )}

                            <Tabs.Trigger
                                width={'100px'}
                                _selected={{ bgColor: theme.colors.main.action }}
                                color={theme.colors.main.text}
                                value="news"
                                onClick={() => {
                                    navigate({ to: '/news' })
                                    setLayoutTab('news')
                                }}
                            >
                                News
                            </Tabs.Trigger>
                            {isLoggedIn && (
                                <>
                                    <Tabs.Trigger
                                        width={'100px'}
                                        _selected={{ bgColor: theme.colors.main.action }}
                                        color={theme.colors.main.text}
                                        value="chat"
                                        onClick={() => {
                                            navigate({ to: '/chat' })
                                            setLayoutTab('chat')
                                        }}
                                    >
                                        Chat
                                    </Tabs.Trigger>
                                    <Tabs.Trigger
                                        width={'100px'}
                                        _selected={{ bg: theme.colors.main.action }}
                                        color={theme.colors.main.text}
                                        value="profile"
                                        onClick={() => {
                                            navigate({ to: `/profile/${user.uid}` })
                                            setLayoutTab('profile')
                                        }}
                                    >
                                        Profile
                                    </Tabs.Trigger>
                                </>
                            )}
                            <Tabs.Trigger
                                width={'100px'}
                                _selected={{ bg: theme.colors.main.action }}
                                color={theme.colors.main.text}
                                value="offline"
                                onClick={() => {
                                    navigate({ to: '/offline' })
                                    setLayoutTab('offline')
                                }}
                            >
                                Offline
                            </Tabs.Trigger>
                            <Tabs.Indicator rounded="l2" bgColor={theme.colors.main.action} />
                            <Box width="100%">
                                <Tabs.Trigger
                                    justifySelf="end"
                                    width="40px"
                                    value="settings"
                                    _selected={{ bg: theme.colors.main.action }}
                                    color={theme.colors.main.text}
                                    onClick={() => {
                                        navigate({ to: '/settings' })
                                        setLayoutTab('settings')
                                    }}
                                >
                                    <Box width={'80px'}>
                                        <Settings />
                                    </Box>
                                </Tabs.Trigger>
                            </Box>
                        </Box>
                    </Tabs.List>
                </Tabs.Root>
            </Box>
            <Box flex="1" display="flex" flexDirection="column" height="calc(100vh - 120px)">
                <Box flex="1" overflowY="auto" p="4" scrollbarWidth={'thin'}>
                    {children}
                </Box>
            </Box>
            <Box
                h="40px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bg={theme.colors.main.secondary}
                px="4"
                flexShrink={0}
            >
                <Text textStyle="xs" color={theme.colors.main.action}>
                    https://discord.gg/T77dSXG7Re
                </Text>
                <Text textStyle="xs" color={theme.colors.main.action}>
                    Hyper Reflector version 0.2.3a 2025
                </Text>
            </Box>
        </Stack>
    )
}
