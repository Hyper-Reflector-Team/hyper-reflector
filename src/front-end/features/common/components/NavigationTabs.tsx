import { Box, Button, Tabs } from '@chakra-ui/react'
import { useConfigStore, useLoginStore } from '@features/common/state'
import { toaster } from '@features/common/ui/toaster'
import { Theme } from '@features/common/utils/theme'
import { Bell, BellOff, Settings } from 'lucide-react'
import { useState } from 'react'

interface NavigationTabsProps {
    theme: Theme
    isLoggedIn: boolean
    selectedTab: string
    onSelectTab: (tab: string) => void
    navigation: ({ to }: { to: string }) => void
}

const NavigationTabs = ({
    theme,
    isLoggedIn,
    selectedTab,
    onSelectTab,
    navigation,
}: NavigationTabsProps) => {
    const user = useLoginStore((state) => state.userState)
    const { configState, updateConfigState } = useConfigStore((state) => state)

    const [activeTab, setActiveTab] = useState(selectedTab)

    const handleTabClick = (tab: string, path: string) => {
        setActiveTab(tab)
        onSelectTab(tab)
        navigation({ to: path })
    }

    return (
        <Tabs.Root
            variant="enclosed"
            value={activeTab}
            _selected={{ bg: theme.colors.main.action }}
            width="100%"
        >
            <Tabs.List
                bg={theme.colors.main.secondary}
                minW="100%"
                borderBottom="none"
                display="flex"
                alignItems="center"
                gap="16px"
                paddingX="8px"
            >
                {/* Grupo izquierdo */}
                <Box display="flex" alignItems="center" gap="8px">
                    {!isLoggedIn && (
                        <Tabs.Trigger
                            width="100px"
                            _selected={{ bg: theme.colors.main.action }}
                            color={theme.colors.main.text}
                            value="login"
                            onClick={() => handleTabClick('login', '/')}
                        >
                            Sign In
                        </Tabs.Trigger>
                    )}
                    {isLoggedIn && (
                        <>
                            <Tabs.Trigger
                                width="100px"
                                _selected={{ bgColor: theme.colors.main.action }}
                                color={theme.colors.main.text}
                                value="news"
                                onClick={() => handleTabClick('news', '/news')}
                            >
                                Home
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                width="100px"
                                _selected={{ bgColor: theme.colors.main.action }}
                                color={theme.colors.main.text}
                                value="chat"
                                onClick={() => handleTabClick('chat', '/chat')}
                            >
                                Lobby
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                width="100px"
                                _selected={{ bg: theme.colors.main.action }}
                                color={theme.colors.main.text}
                                value="profile"
                                onClick={() => handleTabClick('profile', `/profile/${user.uid}`)}
                            >
                                Profile
                            </Tabs.Trigger>
                        </>
                    )}
                </Box>

                <Box flex="1" />

                <Box display="flex" alignItems="center" gap="12px">
                    <Tabs.Trigger
                        width="100px"
                        _selected={{ bg: theme.colors.main.action }}
                        color={theme.colors.main.text}
                        value="offline"
                        onClick={() => handleTabClick('offline', '/offline')}
                    >
                        Offline
                    </Tabs.Trigger>

                    <Button
                        bg="none"
                        width="60px"
                        color={
                            configState?.isAway === 'true'
                                ? theme.colors.main.away
                                : theme.colors.main.active
                        }
                        onClick={() => {
                            const value = configState?.isAway === 'true' ? 'false' : 'true'
                            try {
                                window.api.setConfigValue('isAway', value)
                                updateConfigState({ isAway: value })
                            } catch (error) {
                                toaster.error({ title: 'Error' })
                            }
                        }}
                    >
                        {configState?.isAway !== 'true' ? <Bell /> : <BellOff />}
                    </Button>

                    <Tabs.Trigger
                        value="settings"
                        height="40px"
                        _selected={{ bg: theme.colors.main.action }}
                        color={theme.colors.main.text}
                        onClick={() => handleTabClick('settings', '/settings')}
                    >
                        <Settings />
                    </Tabs.Trigger>
                </Box>
            </Tabs.List>

            <Tabs.Indicator rounded="l2" bgColor={theme.colors.main.action} />
        </Tabs.Root>
    )
}

export default NavigationTabs
