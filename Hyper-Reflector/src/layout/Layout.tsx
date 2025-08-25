import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Box, Stack, IconButton, Image } from '@chakra-ui/react'
import { useSettingsStore, useUserStore } from '../state/store'
import bgImage from '../assets/bgImage.svg'
import hrLogo from '../assets/logo.svg'
import { FlaskConical, LucideHome, MessageCircle, Settings } from 'lucide-react'

export default function Layout({ children }: { children: ReactElement[] }) {
    const navigate = useNavigate()
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    const theme = useSettingsStore((s) => s.theme)

    const changeRoute = (route: string) => {
        navigate({ to: route })
    }

    return (
        <Box display="flex" bgImage={`url(${bgImage})`} bgBlendMode={'color-dodge'}>
            <Stack gap="24px" padding={'12px'} bgColor={'bg.emphasized'}>
                <Box height={'60px'} alignSelf={'center'} flex="1">
                    <Image src={hrLogo} height={'60px'} />
                </Box>
                {globalLoggedIn ? (
                    <Stack alignItems={'center'} gap="24px" flex="2">
                        <IconButton
                            colorPalette={theme.colorPalette}
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/home')}
                            aria-label="Home"
                        >
                            <LucideHome />
                        </IconButton>
                        <IconButton
                            colorPalette={theme.colorPalette}
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/lobby')}
                            aria-label="Lobby"
                        >
                            <MessageCircle />
                        </IconButton>
                        <IconButton
                            colorPalette={theme.colorPalette}
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/lab')}
                            aria-label="Lab"
                        >
                            <FlaskConical />
                        </IconButton>
                    </Stack>
                ) : null}
                {globalLoggedIn ? (
                    <Stack alignItems={'center'} flex="1" gap="24px" justifyContent={'flex-end'}>
                        <IconButton
                            colorPalette={theme.colorPalette}
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/settings')}
                            aria-label="Settings"
                        >
                            <Settings />
                        </IconButton>
                    </Stack>
                ) : null}
            </Stack>
            <Stack flex="1" height={'100vh'}>
                <Box height={'60px'} bgColor={'bg.muted'}>
                    {/* <Box>Notification</Box>
                    <Box>User</Box> */}
                </Box>
                <Box flex="1" display="flex" flexDirection="column" height="calc(100vh - 120px)">
                    <Box flex="1" overflowY="auto" p="4" scrollbarWidth={'thin'}>
                        {children}
                    </Box>
                </Box>
                <Box>Footer</Box>
            </Stack>
        </Box>
    )
}
