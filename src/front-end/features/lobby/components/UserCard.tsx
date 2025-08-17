import {
    Avatar,
    Box,
    Button,
    Circle,
    Flex,
    Float,
    Popover,
    Portal,
    Stack,
    Text,
} from '@chakra-ui/react'
import {
    useConfigStore,
    useLayoutStore,
    useLoginStore,
    useMessageStore,
} from '@features/common/state'
import { Tooltip } from '@features/common/ui/tooltip'
import PingDisplay from '@features/lobby/components/PingDisplay'
import RankDisplay from '@features/lobby/components/RankDisplay'
import { useNavigate } from '@tanstack/react-router'
import { Sword } from 'lucide-react'
import { useEffect, useState } from 'react'
import TitleBadge from './TitleBadge'
import '/node_modules/flag-icons/css/flag-icons.min.css'

export default function UserCard({ user }) {
    const configState = useConfigStore((state) => state.configState)
    const theme = useLayoutStore((state) => state.appTheme)
    const pushMessage = useMessageStore((state) => state.pushMessage)
    const userState = useLoginStore((state) => state.userState)
    const updateUserState = useLoginStore((state) => state.updateUserState)
    const setLayoutTab = useLayoutStore((state) => state.setSelectedTab)
    const [userPopOpen, setUserPopOpen] = useState(false)
    const [cannotChallenge, setCannotChallenge] = useState(false)

    const navigate = useNavigate()

    //TODO: modify this to not use a time out maybe?
    const handleEndMatch = () => {
        setCannotChallenge(false)
        // updateUserState({ ...userState, isFighting: false })
        // setTimeout(() => {
        //     setIsInMatch(false)
        //     clearCallData()
        // }, 2000)
    }

    useEffect(() => {
        window.api.removeAllListeners('endMatchUI', handleEndMatch)
        window.api.on('endMatchUI', handleEndMatch)

        return () => {
            window.api.removeListener('endMatchUI', handleEndMatch)
        }
    }, [])

    const getIsOnline = () => {
        if (user.uid !== userState.uid) {
            return user?.isAway !== 'true'
        }
        if (configState?.isAway === 'true') {
            return false
        }
        return true
    }

    return (
        <Popover.Root
            open={userPopOpen}
            onOpenChange={(e) => setUserPopOpen(e.open)}
            positioning={{ sameWidth: true, offset: { crossAxis: 0, mainAxis: -4 } }}
        >
            <Popover.Trigger asChild>
                <Box
                    maxWidth={'100%'}
                    background={theme.colors.main.card}
                    borderRadius="4px"
                    padding="8px"
                    height="100%"
                    borderWidth="2px"
                    borderColor={theme.colors.main.cardDark}
                    _hover={{ bg: theme.colors.main.cardLight, cursor: 'pointer' }}
                    position={'relative'}
                >
                    <Float placement="middle-start" offsetX="-2.5" offsetY="0">
                        <Tooltip content={`Win Streak`} openDelay={200} closeDelay={100}>
                            <Box
                                textAlign={'center'}
                                alignItems={'center'}
                                className={user.winStreak >= 5 && 'glow'}
                                background={theme.colors.main.bg}
                                width={'32px'}
                                borderRadius={'8px'}
                            >
                                <Text
                                    textStyle="sm"
                                    fontWeight="bold"
                                    color={theme.colors.main.text}
                                    animation={'pulse'}
                                >
                                    {user.winStreak || null}
                                </Text>
                            </Box>
                        </Tooltip>
                    </Float>
                    <Flex justify="space-between" align="center">
                        {/* IZQUIERDA */}
                        <Flex gap="12px" align="center">
                            <Box maxW="80px">
                                <Avatar.Root bg={theme.colors.main.bg} variant="solid">
                                    <Avatar.Fallback name={user.name} />
                                    <Avatar.Image src={user.userProfilePic} />
                                    <Float placement="bottom-end" offsetX="1" offsetY="1">
                                        <Circle
                                            bg={
                                                getIsOnline()
                                                    ? theme.colors.main.active
                                                    : theme.colors.main.away
                                            }
                                            size="8px"
                                            outline="0.2em solid"
                                            outlineColor={theme.colors.main.cardDark}
                                        />
                                    </Float>
                                </Avatar.Root>
                            </Box>
                            <Stack>
                                <Text
                                    textStyle="sm"
                                    fontWeight="bold"
                                    color={theme.colors.main.text}
                                >
                                    {user.name}
                                </Text>
                                <TitleBadge title={user.userTitle || null} />
                            </Stack>
                        </Flex>
                        
                        <Flex align="center">
                            <RankDisplay elo={user.elo ?? 1300} />

                            <PingDisplay
                                peer={
                                    userState?.lastKnownPings?.find((u) => u.id === user.uid) ||
                                    user
                                }
                                userState={userState}
                            />
                        </Flex>
                    </Flex>
                </Box>
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content width="auto" backgroundColor={theme.colors.main.tertiary}>
                        <Popover.Arrow />
                        <Popover.Body>
                            <Flex gap="8px">
                                {user.uid !== userState.uid && (
                                    <Button
                                        borderColor={theme.colors.main.text}
                                        borderWidth={'1px'}
                                        bg={theme.colors.main.action}
                                        disabled={cannotChallenge || !getIsOnline()}
                                        onClick={() => {
                                            setUserPopOpen(false)
                                            setCannotChallenge(true)
                                            window.api.callUser({
                                                callerId: userState.uid,
                                                calleeId: user.uid,
                                            })
                                            pushMessage({
                                                sender: userState.uid,
                                                fromMe: true,
                                                challengedUID: user.uid,
                                                opp: user.name,
                                                message: `You Challenged: ${user.name}`,
                                                type: 'request',
                                                declined: false,
                                                accepted: false,
                                                id: Date.now(), // TODO this is not a long lasting solution
                                            })
                                        }}
                                    >
                                        <Sword />
                                        Challenge
                                    </Button>
                                )}
                                <Button
                                    bg={theme.colors.main.actionSecondary}
                                    onClick={() => {
                                        setUserPopOpen(false)
                                        setLayoutTab('profile')
                                        navigate({ to: `/profile/${user.uid || ''}` })
                                    }}
                                >
                                    Profile
                                </Button>
                            </Flex>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
}
