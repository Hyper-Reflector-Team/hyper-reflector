import { useState } from 'react'
import { Flex, Stack, Text, Button, Box } from '@chakra-ui/react'
import { useMessageStore, useLoginStore, useLayoutStore } from '../../state/store'
import { Swords } from 'lucide-react'

export default function UserChallengeMessage({ message }) {
    const theme = useLayoutStore((state) => state.appTheme)
    const [isDeclined, setIsDeclined] = useState(false)
    const [isAccepted, setIsAccepted] = useState(false)
    const callData = useMessageStore((state) => state.callData)
    const removeCallData = useMessageStore((state) => state.removeCallData)
    const updateMessage = useMessageStore((state) => state.updateMessage)
    const userList = useMessageStore((state) => state.userList)
    const updateUserState = useLoginStore((state) => state.updateUserState)
    const userState = useLoginStore((state) => state.userState)

    var timestamp = new Date()
    const caller = callData.find((call) => call.from === message.sender)
    //TODO: fix bug where decline while fighting has some issues closing on the other users end
    return (
        <Flex
            key={timestamp + message.message}
            flexDirection="column"
            width="100%"
            wordBreak="break-word"
            whiteSpace="pre-wrap"
            p="2"
            borderRadius="md"
            mb="1"
            bg={theme.colors.main.tertiary}
        >
            {message.accepted && <div>Match vs Accepted</div>}
            {message.declined && (
                <Stack>
                    <Box display="flex" color={theme.colors.main.bg}>
                        <Text> Match vs {message?.opp || 'Unknown User'} declined</Text>
                    </Box>
                </Stack>
            )}
            {!message.declined && !message.accepted && (
                <Stack>
                    {message.type && message.type === 'request' && message.type !== 'challenge' && (
                        <Stack>
                            <Box display="flex" color={theme.colors.main.caution}>
                                <Swords />
                                <Text> {message.message}</Text>
                            </Box>
                        </Stack>
                    )}
                    {message.type && message.type !== 'challenge' && message.type !== 'request' && (
                        <Stack>
                            <Text fontWeight="bold" color={theme.colors.main.actionSecondaryLight}>
                                {message.sender}
                            </Text>
                            <Text color={theme.colors.main.text}> {message.message}</Text>
                        </Stack>
                    )}

                    {message.type && message.type === 'challenge' && caller && (
                        <Flex>
                            <Text color={theme.colors.main.text}>Received challenge from: </Text>
                            <Text fontWeight="bold" color={theme.colors.main.actionSecondaryLight}>
                                {userList.find((user) => user.uid === caller.from)?.name ||
                                    'Unknown User'}
                            </Text>
                        </Flex>
                    )}

                    {message.type && message.type === 'challenge' && (
                        <Flex
                            gap="8px"
                            color={theme.colors.main.actionSecondaryLight}
                            alignItems={'center'}
                        >
                            <Swords />
                            <Button
                                onClick={() => {
                                    setIsAccepted(true)
                                    const updatedMessage = {
                                        ...message,
                                        accepted: true,
                                    }
                                    updateMessage(updatedMessage)
                                    window.api.answerCall(caller)
                                    updateUserState({ ...userState, isFighting: true })
                                }}
                            >
                                Accept
                            </Button>
                            <Button
                                onClick={async () => {
                                    // remove the call from the call list
                                    const callToRemove = callData.find(
                                        (call) => call.from === message.sender
                                    )
                                    removeCallData(callToRemove)
                                    // set visual state for declining call
                                    setIsDeclined(true)
                                    await window.api.declineCall(callToRemove)
                                    const updatedMessage = {
                                        ...message,
                                        declined: true,
                                    }
                                    updateMessage(updatedMessage)
                                    updateUserState({ ...userState, isFighting: false })
                                }}
                            >
                                Decline
                            </Button>
                        </Flex>
                    )}
                </Stack>
            )}
        </Flex>
    )
}
