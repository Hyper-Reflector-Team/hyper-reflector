import { ReactElement } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Box, Stack, IconButton, Image } from '@chakra-ui/react'
import { logout } from '../utils/firebase'
import { useUserStore } from '../state/store'
import bgImage from '../assets/bgImage.svg'
import hrLogo from '../assets/logo.svg'
import { FlaskConical, LogOut, LucideHome, MessageCircle, Settings } from 'lucide-react'

export default function Layout({ children }: { children: ReactElement[] }) {
    const navigate = useNavigate()
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    async function logoutHelper() {
        logout()
        changeRoute('/')
    }

    const changeRoute = (route: string) => {
        navigate({ to: route })
    }

    return (
        <Box display="flex" bgImage={`url(${bgImage})`} bgBlendMode={'color-dodge'}>
            <Stack backgroundColor={'black'} gap="24px" padding={'12px'}>
                <Box height={'60px'} alignSelf={'center'} flex="1">
                    <Image src={hrLogo} height={'60px'} />
                </Box>
                {globalLoggedIn ? (
                    <Stack alignItems={'center'} gap="24px" flex="2">
                        <IconButton
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/home')}
                            aria-label="Home"
                        >
                            <LucideHome />
                        </IconButton>
                        <IconButton
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/lobby')}
                            aria-label="Lobby"
                        >
                            <MessageCircle />
                        </IconButton>
                        <IconButton
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
                            width={'40px'}
                            height={'40px'}
                            onClick={() => changeRoute('/settings')}
                            aria-label="Settings"
                        >
                            <Settings />
                        </IconButton>
                        <IconButton
                            width={'40px'}
                            height={'40px'}
                            onClick={logoutHelper}
                            aria-label="Logout"
                        >
                            <LogOut />
                        </IconButton>
                    </Stack>
                ) : null}
            </Stack>
            <Stack flex="1" height={'100vh'}>
                <Box height={'60px'}>
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
