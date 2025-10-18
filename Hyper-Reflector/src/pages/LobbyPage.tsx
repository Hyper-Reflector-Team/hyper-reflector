import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMessageStore, useUserStore } from '../state/store'
import { Stack, Box, Button, Input, Flex } from '@chakra-ui/react'
import { Send } from 'lucide-react'
import UserCardSmall from '../components/UserCard.tsx/UserCardSmall'

export default function LobbyPage() {
    const globalUser = useUserStore((s) => s.globalUser)
    const chatMessages = useMessageStore((s) => s.chatMessages)
    const addChatMessage = useMessageStore((s) => s.addChatMessage)
    const [message, setMessage] = useState('')

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

    const endRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement | null>(null)
    useAutoScrollOnNewContent(boxRef, [chatMessages.length])

    return (
        <Box display="flex" maxH="100%" minH="100%">
            <Box display="flex" flexDirection="column" maxH="100%" minH="100%" flex="8">
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
                            <Stack bgColor={'bg.emphasized'} padding={'2'}>
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
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                maxH="100%"
                minH="100%"
                flex="2"
                overflow="scroll"
            >
                {/* TODO: search */}
                <Input />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
                <UserCardSmall user={globalUser} />
            </Box>
        </Box>
    )
}
