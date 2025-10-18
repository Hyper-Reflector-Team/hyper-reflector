import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMessageStore, useUserStore } from '../state/store'
import {
    Stack,
    Box,
    Button,
    Input,
    Flex,
    Text,
    IconButton,
    CollapsibleContent,
    CollapsibleRoot,
    CollapsibleTrigger,
    createListCollection,
} from '@chakra-ui/react'
import type { SelectValueChangeDetails } from '@chakra-ui/react'
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '../components/chakra/ui/select'
import { Send, Search, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react'
import UserCardSmall from '../components/UserCard.tsx/UserCardSmall'
import type { TUser } from '../types/user'

type EloFilter = 'ALL' | 'ROOKIE' | 'INTERMEDIATE' | 'EXPERT'

type SelectOption = { label: string; value: string }

const ELO_OPTIONS: SelectOption[] = [
    { label: 'All ELO', value: 'ALL' },
    { label: 'Below 1500', value: 'ROOKIE' },
    { label: '1500 - 1999', value: 'INTERMEDIATE' },
    { label: '2000+', value: 'EXPERT' },
]

export default function LobbyPage() {
    const globalUser = useUserStore((s) => s.globalUser)
    const lobbyUsers = useUserStore((s) => s.lobbyUsers)
    const chatMessages = useMessageStore((s) => s.chatMessages)
    const addChatMessage = useMessageStore((s) => s.addChatMessage)
    const [message, setMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [countryFilter, setCountryFilter] = useState('ALL')
    const [eloFilter, setEloFilter] = useState<EloFilter>('ALL')
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const lobbyRoster = useMemo<TUser[]>(() => {
        if (lobbyUsers.length) {
            return lobbyUsers
        }
        return globalUser ? [globalUser] : []
    }, [globalUser, lobbyUsers])

    const countryCodes = useMemo(() => {
        const codes = new Set<string>()
        lobbyRoster.forEach((user) => {
            if (user.countryCode) {
                codes.add(user.countryCode.toUpperCase())
            }
        })
        return Array.from(codes).sort()
    }, [lobbyRoster])

    const countryOptions = useMemo<SelectOption[]>(() => {
        const items: SelectOption[] = [{ label: 'All countries', value: 'ALL' }]
        countryCodes.forEach((code) => items.push({ label: code, value: code }))
        return items
    }, [countryCodes])

    const countryCollection = useMemo(
        () =>
            createListCollection<SelectOption>({
                items: countryOptions,
                itemToValue: (item) => item.value,
                itemToString: (item) => item.label,
            }),
        [countryOptions]
    )

    const eloCollection = useMemo(
        () =>
            createListCollection<SelectOption>({
                items: ELO_OPTIONS,
                itemToValue: (item) => item.value,
                itemToString: (item) => item.label,
            }),
        []
    )

    useEffect(() => {
        if (
            countryFilter !== 'ALL' &&
            !countryOptions.some((option) => option.value === countryFilter)
        ) {
            setCountryFilter('ALL')
        }
    }, [countryFilter, countryOptions])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
    }, [])

    const sendMessage = () => {
        addChatMessage({
            userName: globalUser?.userName || 'Unknown User',
            id: '1234',
            role: 'user',
            text: message,
            timeStamp: Date.now(),
        })
        setMessage('')
    }

    function useAutoScrollOnNewContent(
        ref: React.RefObject<HTMLElement | null>,
        deps: any[],
        pad = 120
    ) {
        useLayoutEffect(() => {
            const el = ref.current
            if (!el) return
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
            const isNearBottom = distFromBottom < pad
            if (isNearBottom) {
                el.scrollTop = el.scrollHeight
            }
        }, deps)
    }

    const handleCountryChange = (details: SelectValueChangeDetails<SelectOption>) => {
        const next = details.items[0]?.value ?? 'ALL'
        setCountryFilter(next)
    }

    const handleEloChange = (details: SelectValueChangeDetails<SelectOption>) => {
        const next = (details.items[0]?.value as EloFilter | undefined) ?? 'ALL'
        setEloFilter(next)
    }

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return lobbyRoster
            .filter((user) => {
                const matchesSearch = !query || user.userName.toLowerCase().includes(query)

                const matchesCountry =
                    countryFilter === 'ALL' || user.countryCode.toUpperCase() === countryFilter

                let matchesElo = true
                switch (eloFilter) {
                    case 'ROOKIE':
                        matchesElo = user.accountElo < 1500
                        break
                    case 'INTERMEDIATE':
                        matchesElo = user.accountElo >= 1500 && user.accountElo < 2000
                        break
                    case 'EXPERT':
                        matchesElo = user.accountElo >= 2000
                        break
                    default:
                        matchesElo = true
                        break
                }
                return matchesSearch && matchesCountry && matchesElo
            })
            .sort((a, b) => a.userName.localeCompare(b.userName))
    }, [countryFilter, eloFilter, lobbyRoster, searchQuery])

    const endRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement | null>(null)
    useAutoScrollOnNewContent(boxRef, [chatMessages.length])

    const scrollChatToBottom = (behavior: ScrollBehavior = 'smooth') => {
        const el = boxRef.current
        if (!el) return
        el.scrollTo({ top: el.scrollHeight, behavior })
        setShowScrollButton(false)
    }

    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const handleScroll = () => {
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
            setShowScrollButton(distanceFromBottom > 120)
        }
        handleScroll()
        el.addEventListener('scroll', handleScroll)
        return () => el.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        if (distanceFromBottom <= 24) {
            setShowScrollButton(false)
        }
    }, [chatMessages.length])

    return (
        <Box display="flex" maxH="100%" minH="100%">
            <Box
                display="flex"
                flexDirection="column"
                maxH="100%"
                minH="100%"
                flex="8"
                position="relative"
            >
                <Stack
                    key="chat"
                    scrollbarWidth="thin"
                    id="chatbox-id"
                    minH={0}
                    overflowY={'scroll'}
                    ref={boxRef}
                >
                    {chatMessages.map((msg) => {
                        return (
                            <Stack bgColor={'bg.emphasized'} padding={'2'} key={msg.id}>
                                <Flex>
                                    {msg.userName} {msg.timeStamp}
                                </Flex>
                                <Box>{msg.text || 'failed message'}</Box>
                            </Stack>
                        )
                    })}
                    <div ref={endRef}></div>
                </Stack>
                <Stack flex="1" height="100%" flexDirection={'column-reverse'}>
                    <Flex gap="2" padding="8px">
                        <Input
                            placeholder="Type a message!"
                            maxW="300px"
                            autoFocus
                            onChange={(e) => setMessage(e.target.value)}
                            type="text"
                            value={message}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    sendMessage()
                                }
                            }}
                        />
                        <Button id="message-send-btn" onClick={sendMessage}>
                            <Send />
                        </Button>
                    </Flex>
                </Stack>
                <Box
                    position="absolute"
                    bottom="40px"
                    right="20px"
                    transition="opacity 0.2s ease, transform 0.2s ease"
                    opacity={showScrollButton ? 1 : 0}
                    pointerEvents={showScrollButton ? 'auto' : 'none'}
                    transform={showScrollButton ? 'translateY(0)' : 'translateY(8px)'}
                >
                    <IconButton
                        aria-label="Scroll to newest message"
                        onClick={() => scrollChatToBottom()}
                        size="sm"
                        variant="solid"
                    >
                        <ArrowDown size={16} />
                    </IconButton>
                </Box>
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                maxH="100%"
                minH="100%"
                flex="2"
                overflow="hidden"
            >
                <CollapsibleRoot
                    open={filtersOpen}
                    onOpenChange={({ open }) => setFiltersOpen(open)}
                    width="100%"
                >
                    <Flex align="center" justify="space-between" px="4" py="2">
                        <Text fontSize="sm" fontWeight="semibold">
                            Filters
                        </Text>
                        <CollapsibleTrigger asChild>
                            <IconButton
                                aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
                                variant="ghost"
                                size="sm"
                            >
                                {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </IconButton>
                        </CollapsibleTrigger>
                    </Flex>
                    <CollapsibleContent>
                        <Stack padding="4" gap="3">
                            <Box position="relative">
                                <Input
                                    pl="8"
                                    placeholder="User name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Search users"
                                />
                                <Box
                                    pointerEvents="none"
                                    position="absolute"
                                    insetY="0"
                                    left="3"
                                    display="flex"
                                    alignItems="center"
                                    color="gray.500"
                                >
                                    <Search size={16} />
                                </Box>
                            </Box>
                            <Flex gap="2" flexWrap="wrap">
                                <SelectRoot<SelectOption>
                                    collection={countryCollection}
                                    value={[countryFilter]}
                                    onValueChange={handleCountryChange}
                                    width="200px"
                                >
                                    <SelectTrigger clearable={countryFilter !== 'ALL'}>
                                        <SelectValueText placeholder="All countries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countryOptions.map((option) => (
                                            <SelectItem key={option.value} item={option}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                                <SelectRoot<SelectOption>
                                    collection={eloCollection}
                                    value={[eloFilter]}
                                    onValueChange={handleEloChange}
                                    width="200px"
                                >
                                    <SelectTrigger clearable={eloFilter !== 'ALL'}>
                                        <SelectValueText placeholder="All ELO" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ELO_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} item={option}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                            </Flex>
                        </Stack>
                    </CollapsibleContent>
                </CollapsibleRoot>
                <Box borderTopWidth="1px" borderColor="gray.700" />
                <Stack flex="1" overflowY="auto" padding="4" gap="2">
                    <Text fontSize="sm" color="gray.500">
                        Showing {filteredUsers.length} of {lobbyRoster.length} users
                    </Text>
                    {filteredUsers.length === 0 ? (
                        <Text fontSize="sm" color="gray.500">
                            No users match the current filters.
                        </Text>
                    ) : (
                        filteredUsers.map((user) => <UserCardSmall key={user.uid} user={user} />)
                    )}
                </Stack>
            </Box>
        </Box>
    )
}
