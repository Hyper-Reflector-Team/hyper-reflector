import { Box, Image, Stack } from '@chakra-ui/react'
import { useEffect } from 'react'
import {
    useConfigStore,
    useLayoutStore,
    useLoginStore,
    useMessageStore,
} from '@features/common/state'
import { toaster } from '@features/common/ui/toaster'
import { getThemeNameList } from '@features/common/utils/theme'
import { useNavigate } from '@tanstack/react-router'

import Footer from '@features/common/components/Footer'
import NavigationTabs from '@features/common/components/NavigationTabs'

import soundBase64Data from '@/assets/sound/challenge.wav'
import bgImage from '@/assets/images/bgImage.svg'
import hrLogo from '@/assets/images/logo.svg'

interface LayoutProps {
    children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    const audioEffect = new Audio(soundBase64Data) // this line for renderer process only

    const layoutTab = useLayoutStore((state) => state.selectedTab)
    const setLayoutTab = useLayoutStore((state) => state.setSelectedTab)
    const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
    const setUserState = useLoginStore((state) => state.setUserState)
    const loggedOut = useLoginStore((state) => state.loggedOut)
    const clearMessageState = useMessageStore((state) => state.clearMessageState)
    const updateMessage = useMessageStore((state) => state.updateMessage)
    const callData = useMessageStore((state) => state.callData)
    const removeCallData = useMessageStore((state) => state.removeCallData)
    const clearUserList = useMessageStore((state) => state.clearUserList)
    const updateConfigState = useConfigStore((state) => state.updateConfigState)
    const theme = useLayoutStore((state) => state.appTheme)
    const setTheme = useLayoutStore((state) => state.setTheme)

    const navigate = useNavigate()
    // Initially set the theme when loaded
    useEffect(() => {
        window.api.getConfigValue('appSoundOn')
        window.api.getConfigValue('isAway')
        window.api.removeExtraListeners('appTheme', handleSetTheme)
        window.api.on('appTheme', handleSetTheme)

        return () => {
            window.api.removeListener('appTheme', handleSetTheme)
        }
    }, [])

    const handleSetTheme = (themeIndex: string) => {
        const themeToSet = getThemeNameList()[parseInt(themeIndex)]
        setTheme(themeToSet)
    }
    // - end

    useEffect(() => {
        window.api.on('loggedOutSuccess', () => {
            clearUserList()
            clearMessageState()
            setUserState({ email: '' })
            loggedOut()
            navigate({ to: '/' })
            console.log('Logged out successfully, navigating to home page')
            // handle do some funky stateful call for logging in redirect etc
        })
        window.api.getAppTheme()
    }, [])

    useEffect(() => {
        if (isLoggedIn) {
            setLayoutTab('chat')
        } else {
            setLayoutTab('login')
        }
    }, [isLoggedIn])

    const handleAlertFromMain = (alertData) => {
        toaster.error({
            title: alertData?.message?.title,
            description: alertData?.message?.description,
        })
    }

    const handleSetConfigState = (data: { key: string; value: string | boolean | number }) => {
        const { key, value } = data
        updateConfigState({
            [key]: value,
        })
    }

    const handleCallDeclined = (fromUID: string) => {
        const callToRemove = callData.find((call) => call.callerId === fromUID)
        removeCallData(callToRemove)
        const messageState = useMessageStore.getState().messageState
        messageState.forEach((m) => {
            if (m?.fromMe && m?.challengedUID === fromUID && !m?.declined) {
                const updatedMessage = {
                    ...m,
                    declined: true,
                }
                updateMessage(updatedMessage)
            }
        })
    }

    useEffect(() => {
        window.api.removeAllListeners('callDeclined', handleCallDeclined)
        window.api.on('callDeclined', handleCallDeclined)
        window.api.removeExtraListeners('getConfigValue', handleSetConfigState)
        window.api.on('getConfigValue', handleSetConfigState)
        window.api.removeExtraListeners('sendAlert', handleAlertFromMain)
        window.api.on('sendAlert', handleAlertFromMain)

        return () => {
            window.api.removeListener('callDeclined', handleCallDeclined)
            window.api.removeListener('getConfigValue', handleSetConfigState)
            window.api.removeListener('sendAlert', handleAlertFromMain)
        }
    }, [])

    // update chats
    const handleChallengeQueue = (messageObject) => {
        const currentConfig = useConfigStore.getState().configState
        if (messageObject.type === 'challenge') {
            if (currentConfig?.appSoundOn === 'true') {
                audioEffect.play()
            }
        }
    }

    // get message from websockets
    useEffect(() => {
        window.api.removeAllListeners('getChallengeQueue', handleChallengeQueue)
        window.api.on('getChallengeQueue', handleChallengeQueue)

        return () => {
            window.api.removeListener('getChallengeQueue', handleChallengeQueue)
        }
    }, [])

    return (
        <Stack
            minH="100vh"
            height="100vh"
            bg={theme.colors.main.bg}
            bgImage={`url(${bgImage})`}
            bgBlendMode={'color-dodge'}
        >
            <Box
                h="60px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bg={theme.colors.main.secondary}
                px="4"
                flexShrink={0}
            >
                <Image src={hrLogo} height={'80px'} />

                <NavigationTabs
                    theme={theme}
                    isLoggedIn={isLoggedIn}
                    selectedTab={layoutTab} // actual value
                    onSelectTab={setLayoutTab} // setter for tab
                    navigation={navigate}
                />
            </Box>
            <Box flex="1" display="flex" flexDirection="column" height="calc(100vh - 120px)">
                <Box flex="1" overflowY="auto" p="4" scrollbarWidth={'thin'}>
                    {children}
                </Box>
            </Box>
            <Footer theme={theme} />
        </Stack>
    )
}

export default Layout
