import { ReactElement, useCallback, useEffect, useMemo, useRef } from 'react'
//@ts-ignore // keys exists
import keys from '../private/keys'
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
    Switch,
} from '@chakra-ui/react'
import { DEFAULT_LOBBY_ID, useMessageStore, useSettingsStore, useUserStore } from '../state/store'
import type { LobbySummary } from '../state/store'
import { useTranslation } from 'react-i18next'
import bgImage from '../assets/bgImage.svg'
import hrLogo from '../assets/logo.svg'
import { Bell, FlaskConical, LucideHome, MessageCircle, Settings } from 'lucide-react'
import UserCard from '../components/UserCard.tsx/UserCard'
import { LobbyManagerDialog } from './components/LobbyManagerDialog'
import { useTauriSoundPlayer } from '../utils/useTauriSoundPlayer'
import { buildMentionRegexes } from '../utils/chatFormatting'
import { toaster } from '../components/chakra/ui/toaster'
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'

const CHALLENGE_ACCEPT_LABEL = 'Accept'
const CHALLENGE_DECLINE_LABEL = 'Decline'
const NOTIFICATIONS_TITLE = 'Notifications'
const NO_NOTIFICATIONS_MESSAGE = 'You have no notifications yet.'
const LOBBY_NAME_MIN_LENGTH = 4
const LOBBY_NAME_MAX_LENGTH = 16

const lobbyNameMatcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
})

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
    const setSignalStatus = useUserStore((s) => s.setSignalStatus)
    const chatMessages = useMessageStore((s) => s.chatMessages)
    const clearChatMessages = useMessageStore((s) => s.clear)
    const currentLobbyId = useUserStore((s) => s.currentLobbyId)
    const setCurrentLobbyId = useUserStore((s) => s.setCurrentLobbyId)
    const lobbyList = useUserStore((s) => s.lobbies)
    const setLobbyList = useUserStore((s) => s.setLobbies)
    const setLobbyUsers = useUserStore((s) => s.setLobbyUsers)
    const theme = useSettingsStore((s) => s.theme)
    const notificationsMuted = useSettingsStore((s) => s.notificationsMuted)
    const setNotificationsMuted = useSettingsStore((s) => s.setNotificationsMuted)
    const notifChallengeSoundEnabled = useSettingsStore((s) => s.notifChallengeSound)
    const notifChallengeSoundPath = useSettingsStore((s) => s.notifChallengeSoundPath)
    const notifMentionSoundEnabled = useSettingsStore((s) => s.notifiAtSound)
    const notifMentionSoundPath = useSettingsStore((s) => s.notifAtSoundPath)
    const accentColor = theme?.colorPalette ?? 'orange'
    const { t } = useTranslation()
    const {
        open: notificationsOpen,
        onOpen: openNotifications,
        onClose: closeNotifications,
    } = useDisclosure()
    const {
        open: lobbyManagerOpen,
        onOpen: openLobbyManager,
        onClose: closeLobbyManager,
    } = useDisclosure()
    const signalSocketRef = useRef<WebSocket | null>(null)
    const { playSound: playSoundFile } = useTauriSoundPlayer()

    const sendSocketMessage = useCallback((payload: Record<string, unknown>) => {
        const socket = signalSocketRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('Signal socket not ready for payload', payload)
            return false
        }

        try {
            socket.send(JSON.stringify(payload))
            return true
        } catch (error) {
            console.error('Failed to send payload to signal server:', error)
            return false
        }
    }, [])

    const handleChallengeResponse = (messageId: string, accepted: boolean) => {
        console.log('Challenge response', { messageId, accepted })
    }

    const mentionHandles = useMemo(() => {
        const handles = new Set<string>()
        const username = globalUser?.userName?.trim()
        if (username) handles.add(username)

        const aliases = Array.isArray(globalUser?.knownAliases)
            ? (globalUser?.knownAliases as string[])
            : []

        aliases.forEach((alias) => {
            if (typeof alias === 'string' && alias.trim()) {
                handles.add(alias.trim())
            }
        })

        return Array.from(handles)
    }, [globalUser?.userName, globalUser?.knownAliases])

    const mentionMatchers = useMemo(
        () => buildMentionRegexes(mentionHandles, 'i'),
        [mentionHandles]
    )

    const availableLobbies = useMemo(() => {
        const entries = new Map<string, LobbySummary>()

        lobbyList.forEach((lobby) => {
            if (!lobby?.name) return
            entries.set(lobby.name, lobby)
        })

        if (!entries.has(DEFAULT_LOBBY_ID)) {
            entries.set(DEFAULT_LOBBY_ID, { name: DEFAULT_LOBBY_ID, users: 0 })
        }

        return Array.from(entries.values()).sort((a, b) => {
            const aUsers = a.users ?? 0
            const bUsers = b.users ?? 0
            if (bUsers !== aUsers) {
                return bUsers - aUsers
            }
            return a.name.localeCompare(b.name)
        })
    }, [lobbyList])

    const currentLobbyIdRef = useRef(currentLobbyId || DEFAULT_LOBBY_ID)

    useEffect(() => {
        currentLobbyIdRef.current = currentLobbyId || DEFAULT_LOBBY_ID
    }, [currentLobbyId])

    useEffect(() => {
        if (!globalLoggedIn) {
            setCurrentLobbyId(DEFAULT_LOBBY_ID)
            setLobbyList([])
            setLobbyUsers([])
            clearChatMessages()
            closeLobbyManager()
        }
    }, [
        clearChatMessages,
        globalLoggedIn,
        closeLobbyManager,
        setCurrentLobbyId,
        setLobbyList,
        setLobbyUsers,
    ])

    const handleLobbyManagerOpen = useCallback(() => {
        openLobbyManager()
    }, [openLobbyManager])

    const handleLobbyManagerClose = useCallback(() => {
        closeLobbyManager()
    }, [closeLobbyManager])

    const handleJoinLobby = useCallback(
        (lobby: LobbySummary, pass: string): string | null => {
            if (!globalUser) {
                toaster.error({
                    title: 'Unable to change lobby',
                    description: 'Please log in before joining a lobby.',
                })
                return 'Please log in before joining a lobby.'
            }

            const trimmedPass = lobby.isPrivate ? pass.trim() : ''
            if (lobby.isPrivate && !trimmedPass.length) {
                return 'Password required for private lobby.'
            }

            const payloadUser = { ...globalUser, lobbyId: lobby.name }
            const sent = sendSocketMessage({
                type: 'changeLobby',
                newLobbyId: lobby.name,
                pass: trimmedPass,
                isPrivate: lobby.isPrivate,
                user: payloadUser,
            })

            if (!sent) {
                return 'Unable to reach lobby server. Please try again.'
            }

            setCurrentLobbyId(lobby.name)
            clearChatMessages()
            setLobbyUsers([])
            toaster.success({
                title: 'Lobby joined',
                description: lobby.name,
            })
            return null
        },
        [clearChatMessages, globalUser, sendSocketMessage, setCurrentLobbyId, setLobbyUsers]
    )

    const handleCreateLobby = useCallback(
        (input: { name: string; isPrivate: boolean; pass: string }): string | null => {
            if (!globalUser) {
                toaster.error({
                    title: 'Unable to create lobby',
                    description: 'Please log in before creating a lobby.',
                })
                return 'Please log in before creating a lobby.'
            }

            const trimmedName = input.name.trim()
            if (!trimmedName.length) {
                return 'Lobby name is required.'
            }
            if (
                trimmedName.length < LOBBY_NAME_MIN_LENGTH ||
                trimmedName.length > LOBBY_NAME_MAX_LENGTH
            ) {
                return `Lobby name must be between ${LOBBY_NAME_MIN_LENGTH} and ${LOBBY_NAME_MAX_LENGTH} characters.`
            }

            if (trimmedName === DEFAULT_LOBBY_ID) {
                return 'Choose a different name from the default lobby.'
            }

            if (lobbyNameMatcher.hasMatch(trimmedName)) {
                return 'Lobby name contains inappropriate language.'
            }

            const trimmedPass = input.isPrivate ? input.pass.trim() : ''
            if (input.isPrivate && !trimmedPass.length) {
                return 'Private lobbies require a password.'
            }

            if (input.isPrivate && trimmedPass.length > 150) {
                return 'Passwords are limited to 150 characters.'
            }

            const exists = availableLobbies.some(
                (lobby) => lobby.name.toLowerCase() === trimmedName.toLowerCase()
            )
            if (exists) {
                return 'A lobby with that name already exists.'
            }

            const payloadUser = { ...globalUser, lobbyId: trimmedName }
            const sent = sendSocketMessage({
                type: 'createLobby',
                lobbyId: trimmedName,
                pass: trimmedPass,
                isPrivate: input.isPrivate,
                user: payloadUser,
            })

            if (!sent) {
                return 'Unable to reach lobby server. Please try again.'
            }

            const optimisticLobby: LobbySummary = {
                name: trimmedName,
                users: 1,
                isPrivate: input.isPrivate,
            }

            const current = useUserStore.getState().lobbies
            const next = [...current.filter((lobby) => lobby.name !== trimmedName), optimisticLobby]
            setLobbyList(next)
            setCurrentLobbyId(trimmedName)
            clearChatMessages()
            setLobbyUsers([])
            toaster.success({
                title: 'Lobby created',
                description: trimmedName,
            })
            return null
        },
        [
            availableLobbies,
            clearChatMessages,
            globalUser,
            sendSocketMessage,
            setCurrentLobbyId,
            setLobbyList,
            setLobbyUsers,
        ]
    )

    const notificationItems = useMemo(() => {
        if (!Array.isArray(chatMessages)) return []

        return chatMessages
            .filter((msg) => {
                if (msg.role === 'challenge') {
                    return true
                }

                if (!msg.text || !mentionMatchers.length) {
                    return false
                }

                return mentionMatchers.some((matcher) => {
                    matcher.lastIndex = 0
                    return matcher.test(msg.text)
                })
            })
            .slice()
            .sort((a, b) => (b.timeStamp ?? 0) - (a.timeStamp ?? 0))
    }, [chatMessages, mentionMatchers])

    const unreadCount = notificationItems.length
    const prevNotificationCountRef = useRef<number>(notificationItems.length)

    useEffect(() => {
        const previousCount = prevNotificationCountRef.current
        if (notificationItems.length <= previousCount) {
            prevNotificationCountRef.current = notificationItems.length
            return
        }

        const newItems = notificationItems.slice(previousCount)
        prevNotificationCountRef.current = notificationItems.length

        if (notificationsMuted) return

        newItems.forEach((item) => {
            if (item.role === 'challenge') {
                if (!notifChallengeSoundEnabled || !notifChallengeSoundPath) return

                void playSoundFile(notifChallengeSoundPath)
            } else {
                if (!notifMentionSoundEnabled || !notifMentionSoundPath) return
                void playSoundFile(notifMentionSoundPath)
            }
        })
    }, [
        notificationItems,
        notificationsMuted,
        notifChallengeSoundEnabled,
        notifChallengeSoundPath,
        notifMentionSoundEnabled,
        notifMentionSoundPath,
        playSoundFile,
    ])

    const changeRoute = (route: string) => {
        navigate({ to: route })
    }

    useEffect(() => {
        if (!globalLoggedIn || !globalUser) {
            setSignalStatus('disconnected')
            if (signalSocketRef.current) {
                signalSocketRef.current.close()
                signalSocketRef.current = null
            }
            return
        }

        setSignalStatus('connecting')
        const socketUrl = `ws://${keys.COTURN_IP}:${keys.SIGNAL_PORT ?? '3003'}`
        const socket = new WebSocket(socketUrl)
        signalSocketRef.current = socket
        let didError = false

        socket.onopen = () => {
            setSignalStatus('connected')
            const lobbyToJoin = currentLobbyIdRef.current || DEFAULT_LOBBY_ID
            setCurrentLobbyId(lobbyToJoin)
            try {
                socket.send(
                    JSON.stringify({
                        type: 'join',
                        user: { ...globalUser, lobbyId: lobbyToJoin },
                    })
                )
            } catch (error) {
                console.error('Failed to send join message to signal server:', error)
            }
        }

        socket.onerror = (event) => {
            didError = true
            console.error('Signal server websocket error:', event)
            setSignalStatus('error')
        }

        socket.onclose = () => {
            signalSocketRef.current = null
            if (!didError) {
                setSignalStatus('disconnected')
            }
        }

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data)
                if (!payload || typeof payload.type !== 'string') return

                switch (payload.type) {
                    case 'connected-users':
                        if (Array.isArray(payload.users)) {
                            setLobbyUsers(payload.users)
                        }
                        break
                    case 'lobby-user-counts': {
                        const updates = Array.isArray(payload.updates) ? payload.updates : []
                        const lobbyMap = new Map<string, LobbySummary>()

                        updates
                            .filter((item: any) => item && typeof item.name === 'string')
                            .forEach((item: any) => {
                                const name = String(item.name).trim()
                                if (!name.length) return

                                const normalized: LobbySummary = {
                                    name,
                                    users: typeof item.users === 'number' ? item.users : 0,
                                    pass:
                                        typeof item.pass === 'string' && item.pass.length
                                            ? item.pass
                                            : undefined,
                                    isPrivate:
                                        typeof item.isPrivate === 'boolean'
                                            ? item.isPrivate
                                            : Boolean(item.pass && item.pass.length),
                                }

                                lobbyMap.set(name, normalized)
                            })

                        if (!lobbyMap.has(DEFAULT_LOBBY_ID)) {
                            lobbyMap.set(DEFAULT_LOBBY_ID, { name: DEFAULT_LOBBY_ID, users: 0 })
                        }

                        setLobbyList(Array.from(lobbyMap.values()))
                        break
                    }
                    case 'lobby-joined':
                        if (typeof payload.lobbyId === 'string' && payload.lobbyId.trim().length) {
                            setCurrentLobbyId(payload.lobbyId.trim())
                            clearChatMessages()
                        }
                        break
                    case 'lobby-closed':
                        if (typeof payload.lobbyId === 'string') {
                            const lobbyId = payload.lobbyId.trim()
                            const current = useUserStore.getState().lobbies
                            const next = current.filter((lobby) => lobby.name !== lobbyId)
                            if (!next.some((lobby) => lobby.name === DEFAULT_LOBBY_ID)) {
                                next.push({ name: DEFAULT_LOBBY_ID, users: 0 })
                            }
                            setLobbyList(next)
                            if (currentLobbyIdRef.current === lobbyId) {
                                setCurrentLobbyId(DEFAULT_LOBBY_ID)
                                clearChatMessages()
                                setLobbyUsers([])
                            }
                        }
                        break
                    case 'error':
                        if (payload.message) {
                            toaster.error({
                                title: 'Lobby server error',
                                description: payload.message,
                            })
                        }
                        break
                    default:
                        break
                }
            } catch (error) {
                console.error('Failed to process signal server payload:', error)
            }
        }

        return () => {
            socket.close()
            signalSocketRef.current = null
        }
    }, [
        clearChatMessages,
        globalLoggedIn,
        globalUser,
        setCurrentLobbyId,
        setLobbyList,
        setLobbyUsers,
        setSignalStatus,
    ])

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
                        px="4"
                        gap="3"
                        justifyContent="space-between"
                    >
                        {globalLoggedIn ? (
                            <Button
                                size="sm"
                                variant="outline"
                                colorPalette={accentColor}
                                onClick={handleLobbyManagerOpen}
                            >
                                Lobby: {currentLobbyId || DEFAULT_LOBBY_ID}
                            </Button>
                        ) : null}
                        <Box display="flex">
                            <UserCard />
                            <Box position="relative" top="1.5">
                                <IconButton
                                    colorPalette={accentColor}
                                    width={'40px'}
                                    height={'40px'}
                                    onClick={openNotifications}
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
            <LobbyManagerDialog
                isOpen={lobbyManagerOpen}
                onClose={handleLobbyManagerClose}
                accentColor={accentColor}
                currentLobbyId={currentLobbyId || DEFAULT_LOBBY_ID}
                availableLobbies={availableLobbies}
                lobbyNameMaxLength={LOBBY_NAME_MAX_LENGTH}
                onJoinLobby={handleJoinLobby}
                onCreateLobby={handleCreateLobby}
            />

            <Drawer.Root
                open={notificationsOpen}
                onOpenChange={({ open }) => {
                    if (!open) {
                        closeNotifications()
                    }
                }}
                size="sm"
            >
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.CloseTrigger />
                        <Drawer.Header>
                            <Drawer.Title>{NOTIFICATIONS_TITLE}</Drawer.Title>
                            <Switch.Root
                                colorPalette={accentColor}
                                size="md"
                                mt="2"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                gap="2"
                                checked={notificationsMuted}
                                onCheckedChange={(event) => setNotificationsMuted(event.checked)}
                            >
                                <Switch.HiddenInput />
                                <Switch.Label fontSize="sm" color="gray.400">
                                    Mute notifications
                                </Switch.Label>
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch.Root>
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
