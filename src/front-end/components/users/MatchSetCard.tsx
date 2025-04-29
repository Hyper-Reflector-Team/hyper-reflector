import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
    Stack,
    Text,
    Box,
    Flex,
    Center,
    Spinner,
    Card,
    Skeleton,
    Portal,
    Collapsible,
    Drawer,
} from '@chakra-ui/react'
import { CloseButton } from '../chakra/ui/close-button'
import { useLayoutStore } from '../../state/store'

function MatchSetCard({
    recentMatches,
    match,
    index,
    isLoading,
    RenderSuperArt,
    selectedMatchDetails,
}) {
    const theme = useLayoutStore((state) => state.appTheme)
    const { userId } = useParams({ strict: false })
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [isLoadingSet, setIsLoadingSet] = useState(false)

    useEffect(() => {
        if (!selectedMatchDetails?.matches.length) {
            setIsLoadingSet(false)
            setDetailsOpen(false)
        }
        if (
            selectedMatchDetails?.matches.length &&
            match?.sessionId === selectedMatchDetails?.sessionId
        ) {
            setIsLoadingSet(false)
            setDetailsOpen(true)
        }
    }, [selectedMatchDetails])

    const VersusCount = () => {
        return (
            <Flex flex="1" justifyContent="center">
                <Text textStyle="md" padding="8px" color={theme.colors.main.textSubdued}>
                    {match.p1Wins}
                </Text>
                <Text textStyle="md" padding="8px" color={theme.colors.main.textSubdued}>
                    VS
                </Text>
                <Text textStyle="md" padding="8px" color={theme.colors.main.textSubdued}>
                    {match.p2Wins}
                </Text>
            </Flex>
        )
    }

    return (
        <Box key={`player-match-${index}`}>
            {isLoading && <Skeleton height="230px" />}
            {!isLoading && (
                <Card.Root
                    variant="elevated"
                    maxH="230px"
                    bg={theme.colors.main.tertiary}
                    _hover={{ bg: theme.colors.main.secondary, cursor: 'pointer' }}
                    onClick={() => {
                        if (recentMatches[index] === match) {
                            if (match.sessionId) {
                                window.api.getGlobalSet({ userId, matchId: match.sessionId })
                                return setIsLoadingSet(true)
                            }
                        }
                    }}
                >
                    <Card.Header color={theme.colors.main.bg}>
                        {new Date(match.timestamp).toLocaleString()}
                    </Card.Header>
                    <Card.Body flex="1">
                        <Flex>
                            <Stack gap="0px" flex="1" alignItems="center">
                                <Text
                                    textStyle="md"
                                    padding="8px"
                                    color={theme.colors.main.textSubdued}
                                >
                                    {match.player1Name}
                                </Text>
                            </Stack>
                            <VersusCount />
                            <Stack gap="0px" flex="1" alignItems="center">
                                <Text
                                    textStyle="md"
                                    padding="8px"
                                    color={theme.colors.main.textSubdued}
                                >
                                    {match.player2Name || 'Unknown User'}
                                </Text>
                            </Stack>
                        </Flex>
                    </Card.Body>
                    <Card.Footer />
                </Card.Root>
            )}
            <Drawer.Root
                open={detailsOpen}
                onOpenChange={(e) => setDetailsOpen(e.open)}
                size={'lg'}
            >
                {isLoadingSet && (
                    <Box
                        pos="absolute"
                        zIndex={'10'}
                        inset="0"
                        bg={theme.colors.main.bg}
                        opacity="50%"
                    >
                        <Center h="full">
                            <Spinner color={theme.colors.main.action} />
                        </Center>
                    </Box>
                )}
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content bg={theme.colors.main.panel}>
                            <Drawer.CloseTrigger
                                color={theme.colors.main.actionSecondary}
                                asChild
                                width="20px"
                                alignSelf="flex-start"
                                position="absolute"
                            >
                                <CloseButton bg={theme.colors.main.bg} size="sm" />
                            </Drawer.CloseTrigger>
                            <Drawer.Header>
                                <Drawer.Title color={theme.colors.main.text}>
                                    <Box display={'flex'}>
                                        <Text
                                            textStyle="md"
                                            padding="8px"
                                            color={theme.colors.main.textSubdued}
                                        >
                                            {match.player1Name || 'Unknown User'}
                                        </Text>
                                        <VersusCount />
                                        <Text
                                            textStyle="md"
                                            padding="8px"
                                            color={theme.colors.main.textSubdued}
                                        >
                                            {match.player2Name || 'Unknown User'}
                                        </Text>
                                    </Box>
                                </Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body scrollbarWidth={'thin'} overflowY="scroll">
                                <Stack>
                                    {detailsOpen &&
                                        selectedMatchDetails?.matches?.length > 0 &&
                                        selectedMatchDetails.matches.map((match, index) => {
                                            return (
                                                <Collapsible.Root>
                                                    <Collapsible.Trigger width={'100%'}>
                                                        <Box
                                                            key={index}
                                                            display={'flex'}
                                                            borderRadius={'8px'}
                                                            bg={theme.colors.main.secondary}
                                                            padding={'8px'}
                                                            alignItems={'center'}
                                                            cursor={'pointer'}
                                                        >
                                                            <Text
                                                                flex="1"
                                                                textStyle="sm"
                                                                padding="8px"
                                                                color={theme.colors.main.action}
                                                            >
                                                                Match: {index + 1} -
                                                            </Text>
                                                            <RenderSuperArt
                                                                code={match.player1Super}
                                                                flex="1"
                                                            />
                                                            <Text
                                                                flex="1"
                                                                textStyle="md"
                                                                padding="8px"
                                                                color={
                                                                    theme.colors.main.textSubdued
                                                                }
                                                            >
                                                                {match.player1Char}
                                                            </Text>
                                                            <Text
                                                                flex="1"
                                                                textStyle="md"
                                                                padding="8px"
                                                                color={
                                                                    theme.colors.main.textSubdued
                                                                }
                                                            >
                                                                VS
                                                            </Text>
                                                            <RenderSuperArt
                                                                code={match.player2Super}
                                                            />
                                                            <Text
                                                                flex="1"
                                                                textStyle="md"
                                                                padding="8px"
                                                                color={
                                                                    theme.colors.main.textSubdued
                                                                }
                                                            >
                                                                {match.player2Char}
                                                            </Text>
                                                        </Box>
                                                    </Collapsible.Trigger>
                                                    <Collapsible.Content>
                                                        <Box padding="4">
                                                            {JSON.stringify(match.matchData)}
                                                        </Box>
                                                    </Collapsible.Content>
                                                </Collapsible.Root>
                                            )
                                        })}
                                </Stack>
                            </Drawer.Body>
                            <Drawer.Footer></Drawer.Footer>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </Box>
    )
}

export default MatchSetCard
