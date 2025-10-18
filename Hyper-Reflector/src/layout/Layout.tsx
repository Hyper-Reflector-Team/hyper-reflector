import { ReactElement, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
    Box,
    Stack,
    IconButton,
    Image,
    Text,
    Flex,
    Drawer,
    useDisclosure,
    VStack,
    HStack,
    Button,
} from '@chakra-ui/react'
import { useMessageStore, useSettingsStore, useUserStore } from '../state/store'
import { useTranslation } from 'react-i18next'
import bgImage from '../assets/bgImage.svg'
import hrLogo from '../assets/logo.svg'
import { Bell, FlaskConical, LucideHome, MessageCircle, Settings } from 'lucide-react'
import UserCard from '../components/UserCard.tsx/UserCard'

const CHALLENGE_ACCEPT_LABEL = 'Accept'
const CHALLENGE_DECLINE_LABEL = 'Decline'
const NOTIFICATIONS_TITLE = 'Notifications'
const NO_NOTIFICATIONS_MESSAGE = 'You have no notifications yet.'

const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) {
        return ''
    }

    try {
        const date = new Date(timestamp)
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    } catch {
        return ''
    }
}

export default function Layout({ children }: { children: ReactElement[] }) {
    const navigate = useNavigate()
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    const globalUser = useUserStore((s) => s.globalUser)
    const chatMessages = useMessageStore((s) => s.chatMessages)
    const theme = useSettingsStore((s) => s.theme)
    const accentColor = theme?.colorPalette ?? 'orange'
    const { t } = useTranslation()
    const notificationsDisclosure = useDisclosure()

    const handleChallengeResponse = (messageId: string, accepted: boolean) => {
        console.log('Challenge response', { messageId, accepted })
    }

    const notificationItems = useMemo(() => {
        const username = globalUser?.userName?.trim()
        const usernameHandle = username ? `@${username.toLowerCase()}` : undefined

        return chatMessages
            .filter((msg) => {
                if (msg.role === 'challenge') {
                    return true
                }

                if (!usernameHandle || !msg.text) {
                    return false
                }

                return msg.text.toLowerCase().includes(usernameHandle)
            })
            .slice()
            .sort((a, b) => (b.timeStamp ?? 0) - (a.timeStamp ?? 0))
    }, [chatMessages, globalUser])

    const unreadCount = notificationItems.length

    const changeRoute = (route: string) => {
        navigate({ to: route })
    }

    return (
        <>
            <Box display="flex" bgImage={`url(${bgImage})`} bgBlendMode={'color-dodge'}>
                <Stack gap="24px" padding={'12px'} bgColor={'bg.emphasized'}>
                    <Box height={'64px'} alignSelf={'center'} flex="1">
                        <Image src={hrLogo} height={'64px'} />
                    </Box>
                    {globalLoggedIn ? (
                        <Stack alignItems={'center'} gap="24px" flex="2">
                            <IconButton
                                colorPalette={accentColor}
                                width={'40px'}
                                height={'40px'}
                                onClick={() => changeRoute('/home')}
                                aria-label="Home"
                            >
                                <LucideHome />
                            </IconButton>
                            <IconButton
                                colorPalette={accentColor}
                                width={'40px'}
                                height={'40px'}
                                onClick={() => changeRoute('/lobby')}
                                aria-label="Lobby"
                            >
                                <MessageCircle />
                            </IconButton>
                            <IconButton
                                colorPalette={accentColor}
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
                        <Stack
                            alignItems={'center'}
                            flex="1"
                            gap="24px"
                            justifyContent={'flex-end'}
                        >
                            <IconButton
                                colorPalette={accentColor}
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
                    <Flex
                        height={'48px'}
                        bgColor={'bg.muted'}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        px="4"
                    >
                        <UserCard />
                        <Box position="relative">
                            <IconButton
                                colorPalette={accentColor}
                                width={'40px'}
                                height={'40px'}
                                onClick={notificationsDisclosure.onOpen}
                                aria-label="Open notifications"
                            >
                                <Bell />
                            </IconButton>
                            {unreadCount > 0 ? (
                                <Box
                                    position="absolute"
                                    top="-4px"
                                    right="-4px"
                                    minWidth="18px"
                                    height="18px"
                                    borderRadius="full"
                                    bg={`${accentColor}.500`}
                                    color="white"
                                    fontSize="xs"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    px="1"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Box>
                            ) : null}
                        </Box>
                    </Flex>
                    <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        height="calc(100vh - 120px)"
                    >
                        <Box flex="1" overflowY="auto" p="4" scrollbarWidth={'thin'}>
                            {children}
                        </Box>
                    </Box>
                    <Box
                        h="24px"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        px="4"
                        flexShrink={0}
                    >
                        {/* These links no longer work, needs to be resolved */}
                        <Box display="flex" gap="8px">
                            <a href="https://hyper-reflector.com/" target="_blank" rel="noreferrer">
                                <Text textStyle="xs">Hyper Reflector on:</Text>
                            </a>
                            <a
                                href="https://discord.gg/fsQEVzXwbt"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Text textStyle="xs">Discord</Text>
                            </a>
                            <a
                                href="https://github.com/Hyper-Reflector-Team"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Text textStyle="xs">Github</Text>
                            </a>
                        </Box>

                        <Text textStyle="xs">Hyper Reflector version 0.5.0a 2025</Text>
                    </Box>
                </Stack>
            </Box>
            <Drawer.Root
                open={notificationsDisclosure.open}
                onOpenChange={({ open }) =>
                    open ? notificationsDisclosure.onOpen() : notificationsDisclosure.onClose()
                }
                // placement="right"
                size="sm"
            >
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.CloseTrigger />
                        <Drawer.Header>
                            <Drawer.Title>{NOTIFICATIONS_TITLE}</Drawer.Title>
                        </Drawer.Header>
                        <Drawer.Body>
                            <VStack align="stretch">
                                {notificationItems.length === 0 ? (
                                    <Text fontSize="sm" color="gray.500">
                                        {NO_NOTIFICATIONS_MESSAGE}
                                    </Text>
                                ) : (
                                    notificationItems.map((msg) => {
                                        const isSelf = msg.userName === globalUser?.userName

                                        return (
                                            <Stack
                                                key={msg.id}
                                                borderWidth="1px"
                                                borderRadius="md"
                                                padding="3"
                                                bg="bg.canvas"
                                            >
                                                <Flex
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Text
                                                        fontWeight="semibold"
                                                        color={
                                                            isSelf
                                                                ? `${accentColor}.500`
                                                                : undefined
                                                        }
                                                    >
                                                        {msg.userName ?? 'Unknown user'}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {formatTimestamp(msg.timeStamp)}
                                                    </Text>
                                                </Flex>
                                                <Box height="1px" bg="border" />
                                                <Text fontSize="sm" whiteSpace="pre-wrap">
                                                    {msg.text || 'No message content'}
                                                </Text>
                                                {msg.role === 'challenge' ? (
                                                    <HStack pt="1">
                                                        <Button
                                                            size="sm"
                                                            colorPalette={accentColor}
                                                            onClick={() =>
                                                                handleChallengeResponse(
                                                                    msg.id,
                                                                    true
                                                                )
                                                            }
                                                        >
                                                            {CHALLENGE_ACCEPT_LABEL}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleChallengeResponse(
                                                                    msg.id,
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            {CHALLENGE_DECLINE_LABEL}
                                                        </Button>
                                                    </HStack>
                                                ) : null}
                                            </Stack>
                                        )
                                    })
                                )}
                            </VStack>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </>
    )
}
