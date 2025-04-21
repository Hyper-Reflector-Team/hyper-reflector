import { useRef, useEffect } from 'react'
import { Stack, Box } from '@chakra-ui/react'
import { useLoginStore, useMessageStore } from '../state/store'
import UserChallengeMessage from './chat/UserChallengeMessage'

import soundBase64Data from './sound/challenge.wav'

export default function ChatWindow() {
    const messageState = useMessageStore((state) => state.messageState)
    const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
    const pushMessage = useMessageStore((state) => state.pushMessage)
    const userState = useLoginStore((state) => state.userState)

    const chatEndRef = useRef<null | HTMLDivElement>(null)

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleRoomMessage = (messageObject) => {
        if (messageObject.type === 'challenge' && !userState.isFighting) {
            new Audio(soundBase64Data).play() // this line for renderer process only
        }
        pushMessage({
            sender: messageObject.sender,
            message: messageObject.message,
            type: messageObject.type || 'sendMessage',
            declined: false,
            accepted: false,
            id: Date.now(), // TODO this is not a long lasting solution
        })
    }

    // get message from websockets
    useEffect(() => {
        window.api.removeAllListeners('sendRoomMessage', handleRoomMessage)
        window.api.on('sendRoomMessage', handleRoomMessage)

        return () => {
            window.api.removeListener('sendRoomMessage', handleRoomMessage)
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messageState])

    return (
        <Stack height="100%" key={'chat'} overflowY="auto" scrollbarWidth={'thin'} id="chatbox-id">
            {isLoggedIn && (
                <Box paddingLeft="8px" paddingRight="8px">
                    {messageState.map((message, index) => {
                        return (
                            <UserChallengeMessage
                                key={`challenge-message-${index}`}
                                message={message}
                            />
                        )
                    })}
                    <Box ref={chatEndRef} />
                </Box>
            )}
        </Stack>
    )
}
