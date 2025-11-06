import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type { LobbySummary, TMessage } from '../state/store'
import type { TUser } from '../types/user'
import { useTranslation } from 'react-i18next'
import bgImage from '../assets/bgImage.svg'
import hrLogo from '../assets/logo.svg'
import { Bell, BellOff, FlaskConical, LucideHome, MessageCircle, Settings, Swords } from 'lucide-react'
import UserCard from '../components/UserCard.tsx/UserCard'
import { LobbyManagerDialog } from './components/LobbyManagerDialog'
import { useTauriSoundPlayer } from '../utils/useTauriSoundPlayer'
import { buildMentionRegexes } from '../utils/chatFormatting'
import { toaster } from '../components/chakra/ui/toaster'
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'
import {
    cancelPendingChallengesForChallenger,
    cancelPendingChallengesInvolving,
    normalizeChallengeParticipants,
} from './helpers/challenges'
import {
    appendMockUser,
    buildMockForLobby,
    MOCK_ACTION_INTERVAL_MS,
    MOCK_CHALLENGE_LINES,
    MOCK_CHALLENGE_USER,
    MOCK_CHAT_LINES,
    normalizeSocketUser,
} from './helpers/mockUsers'
import { formatTimestamp } from './helpers/time'
import { STATUS_COLOR_MAP, STATUS_LABEL_MAP } from './helpers/status'
import {
    AUTO_DECLINE_RESPONDER,
    AUTO_RESOLVE_RESPONDER,
    CHALLENGE_ACCEPT_LABEL,
    CHALLENGE_DECLINE_LABEL,
    LOBBY_NAME_MAX_LENGTH,
    LOBBY_NAME_MIN_LENGTH,
    NOTIFICATIONS_TITLE,
    NO_NOTIFICATIONS_MESSAGE,
} from './helpers/constants'

import {
    initWebRTC,
    startCall,
    answerCall,
    declineCall as webrtcDeclineCall,
    closeConnectionWithUser,
} from '../webRTC/WebPeer'

const lobbyNameMatcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
})

type SendMessageEventDetail = {
    text: string
    onSuccess?: () => void
    onError?: (message: string) => void
}

type ChallengeEventDetail = {
    targetUid: string
}

type NotificationEntry = {
    message: TMessage
    kind: 'challenge' | 'mention'
}

type ChallengeResponseDetail = {
    messageId: string
    accepted: boolean
    responderName?: string
}

export default function Layout({ children }: { children: ReactElement[] }) {
    const navigate = useNavigate()
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    const globalUser = useUserStore((s) => s.globalUser)
    const signalStatus = useUserStore((s) => s.signalStatus)
    const setSignalStatus = useUserStore((s) => s.setSignalStatus)
    const chatMessages = useMessageStore((s) => s.chatMessages)
    const clearChatMessages = useMessageStore((s) => s.clear)
    const currentLobbyId = useUserStore((s) => s.currentLobbyId)
    const setCurrentLobbyId = useUserStore((s) => s.setCurrentLobbyId)
    const lobbyList = useUserStore((s) => s.lobbies)
    const setLobbyList = useUserStore((s) => s.setLobbies)
    const lobbyUsers = useUserStore((s) => s.lobbyUsers)
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

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const opponentUidRef = useRef<string | null>(null)
    const mockActionIndexRef = useRef(0)
    const declineChallengeWithSocket = useCallback(
        (targetId: string, challengerId: string) => {
            const socket = signalSocketRef.current
            if (!socket) {
                return
            }
            webrtcDeclineCall(socket, targetId, challengerId).catch((error) => {
                console.error('Failed to auto-decline challenge:', error)
            })
        },
        [signalSocketRef]
    )
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

    const handleChallengeResponse = useCallback(
        (messageId: string, accepted: boolean, responderName?: string) => {
            const responder =
                responderName && responderName.trim().length
                    ? responderName.trim()
                    : globalUser?.userName || 'You'
            const status = accepted ? 'accepted' : 'declined'

            const { chatMessages, updateMessage } = useMessageStore.getState()
            const targetMessage = chatMessages.find((message) => message.id === messageId)
            const { challengerId, opponentId } = normalizeChallengeParticipants(
                targetMessage,
                globalUser?.uid
            )

            updateMessage(messageId, {
                challengeStatus: status,
                challengeResponder: responder,
                challengeChallengerId: challengerId,
                challengeOpponentId: opponentId,
            })

            if (accepted) {
                toaster.success({
                    title: 'Challenge accepted',
                    description: `${responder} accepted the challenge.`,
                })

                const participantIds = [challengerId, opponentId].filter(
                    (id): id is string => Boolean(id)
                )

                if (participantIds.length) {
                    cancelPendingChallengesInvolving({
                        participantIds,
                        excludeMessageIds: [messageId],
                        reason: AUTO_RESOLVE_RESPONDER,
                        currentUserId: globalUser?.uid,
                        declineChallenge: declineChallengeWithSocket,
                    })
                }
            } else {
                toaster.info({
                    title: 'Challenge declined',
                    description: `${responder} declined the challenge.`,
                })
            }
        },
        [cancelPendingChallengesInvolving, declineChallengeWithSocket, globalUser?.uid, globalUser?.userName]
    )

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

    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(
        () => new Set()
    )

    const hasRealOpponent = useMemo(() => {
        if (!Array.isArray(lobbyUsers) || !lobbyUsers.length) {
            return false
        }

        return lobbyUsers.some((user) => {
            if (!user || !user.uid || user.uid === globalUser?.uid) {
                return false
            }

            if (user.uid === MOCK_CHALLENGE_USER.uid) {
                return false
            }

            return !user.uid.startsWith('mock-')
        })
    }, [globalUser?.uid, lobbyUsers])

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

    const startChallenge = useCallback(
        async (targetUid: string) => {
            if (!globalUser?.uid) {
                toaster.error({
                    title: 'Unable to challenge',
                    description: 'Please log in before sending challenges.',
                })
                return
            }

            cancelPendingChallengesForChallenger({
                challengerId: globalUser.uid,
                reason: AUTO_DECLINE_RESPONDER,
                currentUserId: globalUser.uid,
                declineChallenge: declineChallengeWithSocket,
            })

            const socket = signalSocketRef.current
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                toaster.error({
                    title: 'Unable to challenge',
                    description: 'Signal server is not connected.',
                })
                return
            }

            try {
                if (opponentUidRef.current) {
                    closeConnectionWithUser(opponentUidRef.current)
                    opponentUidRef.current = null
                }
                if (peerConnectionRef.current) {
                    try {
                        peerConnectionRef.current.close()
                    } catch (error) {
                        console.error('Failed to close previous peer connection:', error)
                    }
                    peerConnectionRef.current = null
                }

                const peer = await initWebRTC(globalUser.uid, targetUid, socket)
                peerConnectionRef.current = peer
                opponentUidRef.current = targetUid
                await startCall(peer, socket, targetUid, globalUser.uid, true)
                toaster.success({
                    title: 'Challenge sent',
                    description: 'Waiting for opponent to respond.',
                })
            } catch (error) {
                console.error('Failed to initiate challenge:', error)
                toaster.error({
                    title: 'Challenge failed',
                    description: 'Unable to initiate WebRTC call.',
                })
            }
        },
        [declineChallengeWithSocket, globalUser?.uid]
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

    const notificationEntries: NotificationEntry[] = useMemo(() => {
        if (!Array.isArray(chatMessages)) return []

        const entries: NotificationEntry[] = []
        const dismissed = dismissedNotificationIds

        chatMessages.forEach((msg) => {
            if (!msg?.id || dismissed.has(msg.id)) {
                return
            }

            if (msg.role === 'challenge') {
                entries.push({ message: msg, kind: 'challenge' })
                return
            }

            if (!msg.text || !mentionMatchers.length) {
                return
            }

            const text = msg.text ?? ''
            const hasMention = mentionMatchers.some((matcher) => {
                matcher.lastIndex = 0
                return matcher.test(text)
            })

            if (hasMention) {
                entries.push({ message: msg, kind: 'mention' })
            }
        })

        return entries.sort((a, b) => {
            const aTime = a.message.timeStamp ?? 0
            const bTime = b.message.timeStamp ?? 0
            return bTime - aTime
        })
    }, [chatMessages, mentionMatchers, dismissedNotificationIds])

    const handleClearNotifications = useCallback(() => {
        if (!notificationEntries.length) {
            return
        }

        const ids = notificationEntries.map((entry) => entry.message.id)
        if (!ids.length) {
            return
        }

        setDismissedNotificationIds((prev) => {
            const next = new Set(prev)
            ids.forEach((id) => next.add(id))
            return next
        })

        const socket = signalSocketRef.current
        if (socket && globalUser?.uid) {
            const challengeTargets = notificationEntries
                .filter((entry) => entry.kind === 'challenge')
                .map((entry) => {
                    const sender = (entry.message as any).sender || {}
                    return sender.uid || sender.userUID || sender.id || null
                })
                .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0)

            challengeTargets.forEach((uid) => {
                webrtcDeclineCall(socket, uid, globalUser.uid).catch((error) => {
                    console.error('Failed to decline challenge for', uid, error)
                })
            })
        }

        closeNotifications()
        toaster.success({ title: 'Notifications cleared' })
    }, [closeNotifications, globalUser?.uid, notificationEntries])

    const unreadCount = notificationEntries.length
    const seenNotificationIdsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const seen = seenNotificationIdsRef.current
        const nextSeen = new Set(notificationEntries.map((entry) => entry.message.id))

        if (!notificationsMuted) {
            const newEntries = notificationEntries.filter(
                (entry) => !seen.has(entry.message.id)
            )

            newEntries.forEach((entry) => {
                if (entry.kind === 'challenge') {
                    if (!notifChallengeSoundEnabled || !notifChallengeSoundPath) return
                    void playSoundFile(notifChallengeSoundPath)
                } else {
                    if (!notifMentionSoundEnabled || !notifMentionSoundPath) return
                    void playSoundFile(notifMentionSoundPath)
                }
            })
        }

        seenNotificationIdsRef.current = nextSeen
    }, [
        notificationEntries,
        notificationsMuted,
        notifChallengeSoundEnabled,
        notifChallengeSoundPath,
        notifMentionSoundEnabled,
        notifMentionSoundPath,
        playSoundFile,
    ])

    useEffect(() => {
        if (!globalLoggedIn || !globalUser?.uid || hasRealOpponent) {
            return
        }

        const runMockInteraction = () => {
            const mockUser =
                buildMockForLobby(
                    currentLobbyIdRef.current || DEFAULT_LOBBY_ID,
                    mockActionIndexRef.current
                ) || MOCK_CHALLENGE_USER
            const now = Date.now()
            const addChatMessage = useMessageStore.getState().addChatMessage
            const shouldChallenge = Math.random() < 0.4

            if (shouldChallenge && MOCK_CHALLENGE_LINES.length) {
                const challengeLine =
                    MOCK_CHALLENGE_LINES[
                        mockActionIndexRef.current % MOCK_CHALLENGE_LINES.length
                    ]
                const challengeMessage: TMessage & { sender: TUser } = {
                    id: `mock-challenge-${now}`,
                    role: 'challenge',
                    text: `${mockUser.userName} ${challengeLine}`,
                    timeStamp: now,
                    userName: mockUser.userName,
                    sender: mockUser,
                    challengeChallengerId: mockUser.uid,
                    challengeOpponentId: globalUser?.uid,
                }
                addChatMessage(challengeMessage)
                toaster.info({
                    title: 'Challenge incoming',
                    description: `${mockUser.userName} ${challengeLine}`,
                })
                mockActionIndexRef.current += 1
                return
            }

            if (!MOCK_CHAT_LINES.length) {
                return
            }

            const chatTemplate =
                MOCK_CHAT_LINES[mockActionIndexRef.current % MOCK_CHAT_LINES.length]
            const playerName = (globalUser?.userName ?? 'friend').trim() || 'friend'
            const chatMessage: TMessage = {
                id: `mock-message-${now}`,
                role: 'user',
                text: chatTemplate.replace('{player}', playerName),
                timeStamp: now,
                userName: mockUser.userName,
            }
            addChatMessage(chatMessage)
            mockActionIndexRef.current += 1
        }

        runMockInteraction()
        const intervalId = window.setInterval(runMockInteraction, MOCK_ACTION_INTERVAL_MS)
        return () => window.clearInterval(intervalId)
    }, [globalLoggedIn, globalUser?.uid, globalUser?.userName, hasRealOpponent])

    const statusColor =
        STATUS_COLOR_MAP[signalStatus] ?? STATUS_COLOR_MAP.disconnected
    const statusLabel =
        STATUS_LABEL_MAP[signalStatus] ?? STATUS_LABEL_MAP.disconnected

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<SendMessageEventDetail>).detail
            if (!detail) return

            const trimmed = detail.text?.trim()
            if (!trimmed) {
                detail.onError?.('Message cannot be empty.')
                return
            }

            if (!globalUser?.uid) {
                detail.onError?.('Please log in before chatting.')
                return
            }

            const messageId = `${globalUser.uid ?? 'message'}-${Date.now()}`
            const payload = {
                type: 'sendMessage',
                message: trimmed,
                messageId,
                sender: { ...globalUser, lobbyId: currentLobbyIdRef.current || DEFAULT_LOBBY_ID },
            }

            const sent = sendSocketMessage(payload)
            if (!sent) {
                detail.onError?.('Unable to reach message server.')
                return
            }

            detail.onSuccess?.()
        }

        window.addEventListener('ws:send-message', handler as EventListener)
        return () => window.removeEventListener('ws:send-message', handler as EventListener)
    }, [globalUser, sendSocketMessage])

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<ChallengeResponseDetail>).detail
            if (!detail?.messageId) return

            handleChallengeResponse(detail.messageId, detail.accepted, detail.responderName)
        }

        window.addEventListener('lobby:challenge-response', handler as EventListener)
        return () => window.removeEventListener('lobby:challenge-response', handler as EventListener)
    }, [handleChallengeResponse])

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<ChallengeEventDetail>).detail
            if (!detail?.targetUid) return

            void startChallenge(detail.targetUid)
        }

        window.addEventListener('lobby:challenge-user', handler as EventListener)
        return () => window.removeEventListener('lobby:challenge-user', handler as EventListener)
    }, [startChallenge])

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
            if (peerConnectionRef.current) {
                try {
                    peerConnectionRef.current.close()
                } catch (error) {
                    console.error('Failed to close peer connection:', error)
                }
                peerConnectionRef.current = null
                opponentUidRef.current = null
            }
            if (!didError) {
                setSignalStatus('disconnected')
            }
        }

        socket.onmessage = async (event) => {
            try {
                const payload = JSON.parse(event.data)
                if (!payload || typeof payload.type !== 'string') return

                switch (payload.type) {
                    case 'connected-users':
                        if (Array.isArray(payload.users)) {
                            const normalizedUsers = payload.users
                                .map((entry: unknown) => normalizeSocketUser(entry))
                                .filter((user: any): user is TUser => Boolean(user)) // TODO this typing is strange
                            const activeLobbyId = currentLobbyIdRef.current || DEFAULT_LOBBY_ID
                            setLobbyUsers(appendMockUser(normalizedUsers, activeLobbyId))
                        }
                        break
                    case 'getRoomMessage': {
                        if (typeof payload.message === 'undefined') {
                            break
                        }

                        const textMessage = String(payload.message)
                        const sender = payload.sender || {}
                        const normalizedSender = normalizeSocketUser(sender)
                        const timeStamp =
                            typeof payload.timeStamp === 'number' ? payload.timeStamp : Date.now()
                        const messageId =
                            typeof payload.id === 'string' && payload.id.length
                                ? payload.id
                                : normalizedSender?.uid
                                  ? `${normalizedSender.uid}-${timeStamp}`
                                  : `message-${timeStamp}`
                        const message: TMessage = {
                            id: messageId,
                            role: 'user',
                            text: textMessage,
                            timeStamp,
                            userName:
                                normalizedSender?.userName ||
                                sender.userName ||
                                sender.name ||
                                sender.uid ||
                                'Unknown user',
                        }

                        useMessageStore.getState().addChatMessage(message)
                        break
                    }
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
                    case 'webrtc-ping-offer': {
                        if (!globalUser?.uid || !payload.from || !payload.offer) {
                            break
                        }

                        try {
                            const peer = await initWebRTC(globalUser.uid, payload.from, socket)
                            peerConnectionRef.current = peer
                            opponentUidRef.current = payload.from
                            await peer.setRemoteDescription(
                                new RTCSessionDescription(payload.offer)
                            )
                            toaster.info({
                                title: 'Incoming challenge',
                                description: `User ${payload.from} wants to play.`,
                            })
                            await answerCall(peer, socket, payload.from, globalUser.uid)
                        } catch (error) {
                            console.error('Failed to handle incoming offer:', error)
                        }
                        break
                    }
                    case 'webrtc-ping-answer': {
                        if (!payload.from || !payload.answer) {
                            break
                        }

                        try {
                            if (peerConnectionRef.current) {
                                await peerConnectionRef.current.setRemoteDescription(
                                    new RTCSessionDescription(payload.answer)
                                )
                                opponentUidRef.current = payload.from
                            }
                        } catch (error) {
                            console.error('Failed to handle answer:', error)
                        }
                        break
                    }
                    case 'webrtc-ping-candidate': {
                        if (!payload.candidate) {
                            break
                        }

                        try {
                            if (peerConnectionRef.current) {
                                await peerConnectionRef.current.addIceCandidate(
                                    new RTCIceCandidate(payload.candidate)
                                )
                            }
                        } catch (error) {
                            console.error('Failed to add ICE candidate:', error)
                        }
                        break
                    }
                    case 'webrtc-ping-decline': {
                        if (payload.from) {
                            closeConnectionWithUser(payload.from)
                            opponentUidRef.current = null
                            toaster.info({
                                title: 'Challenge declined',
                                description: `User ${payload.from} is unavailable.`,
                            })
                        }
                        break
                    }
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
                                    {notificationsMuted ? <BellOff /> : <Bell />}
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

                        <Flex alignItems="center" gap="3">
                            <Box display="flex" alignItems="center" gap="2">
                                <Box
                                    width="10px"
                                    height="10px"
                                    borderRadius="9999px"
                                    backgroundColor={statusColor}
                                />
                                <Text textStyle="xs" color="gray.400">
                                    {statusLabel}
                                </Text>
                            </Box>
                            <Text textStyle="xs">Hyper Reflector version 0.5.0a 2025</Text>
                        </Flex>
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
                            <Flex justify="space-between" align="center" gap="3">
                                <Drawer.Title>{NOTIFICATIONS_TITLE}</Drawer.Title>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => handleClearNotifications()}
                                    disabled={notificationEntries.length === 0}
                                >
                                    Clear
                                </Button>
                            </Flex>
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
                                {notificationEntries.length === 0 ? (
                                    <Text fontSize="sm" color="gray.500">
                                        {NO_NOTIFICATIONS_MESSAGE}
                                    </Text>
                                ) : (
                                    notificationEntries.map(({ message: msg, kind }) => {
                                        const isSelf = msg.userName === globalUser?.userName
                                        const isChallenge = msg.role === 'challenge' || kind === 'challenge'
                                        const challengeStatus = msg.challengeStatus
                                        const responderLabel =
                                            msg.challengeResponder && msg.challengeResponder.length
                                                ? msg.challengeResponder
                                                : 'Unknown player'

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
                                                <Flex alignItems="center" gap="2">
                                                    {isChallenge ? <Swords size={16} /> : null}
                                                    <Text fontSize="sm" whiteSpace="pre-wrap">
                                                        {msg.text || 'No message content'}
                                                    </Text>
                                                </Flex>
                                                {isChallenge ? (
                                                    challengeStatus ? (
                                                        <Text
                                                            fontSize="xs"
                                                            color={
                                                                challengeStatus === 'accepted'
                                                                    ? `${accentColor}.500`
                                                                    : 'red.300'
                                                            }
                                                        >
                                                            {`Challenge ${challengeStatus} by ${responderLabel}.`}
                                                        </Text>
                                                    ) : (
                                                        <HStack pt="1">
                                                            <Button
                                                                size="sm"
                                                                colorPalette={accentColor}
                                                                onClick={() =>
                                                                    handleChallengeResponse(
                                                                        msg.id,
                                                                        true,
                                                                        globalUser?.userName
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
                                                                        false,
                                                                        globalUser?.userName
                                                                    )
                                                                }
                                                            >
                                                                {CHALLENGE_DECLINE_LABEL}
                                                            </Button>
                                                        </HStack>
                                                    )
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
