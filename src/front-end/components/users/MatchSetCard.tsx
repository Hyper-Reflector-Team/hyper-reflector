import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
    IconButton,
    ButtonGroup,
    Stack,
    Text,
    Heading,
    Box,
    Flex,
    Center,
    Spinner,
    Card,
    Pagination,
    Skeleton,
    Editable,
    Select,
    Button,
    Portal,
} from '@chakra-ui/react'
import { Drawer } from '@chakra-ui/react'
import theme from '../../utils/theme'
import { CloseButton } from '../chakra/ui/close-button'

function MatchSetCard({ match, index, isLoading, RenderSuperArt }) {
    const { userId } = useParams({ strict: false })
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedMatchDetails, setSelectedMatchDetails] = useState(undefined)

    const globalSetDataFill = ({ globalSet }) => {
        setSelectedMatchDetails(globalSet)
    }

    useEffect(() => {
        window.api.removeExtraListeners('getGlobalSet', globalSetDataFill)
        window.api.on('getGlobalSet', globalSetDataFill)

        return () => {
            window.api.removeListener('getGlobalSet', globalSetDataFill)
        }
    }, [])

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
        <Box key={`player-match-${index}`} width="80%">
            {isLoading && <Skeleton height="230px" />}
            {!isLoading && (
                <Card.Root
                    variant="elevated"
                    maxH="230px"
                    bg={theme.colors.main.tertiary}
                    _hover={{ bg: theme.colors.main.secondary, cursor: 'pointer' }}
                    onClick={() => {
                        console.log('open')
                        setDetailsOpen(true)
                        window.api.getGlobalSet({ userId, matchId: match.sessionId })
                    }}
                >
                    <Card.Header color={theme.colors.main.action}>
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
                                {/* <Text
                                    textStyle="xs"
                                    padding="8px"
                                    color={theme.colors.main.textSubdued}
                                >
                                    {match.player1Char}
                                </Text> */}
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
                                {/* <Text
                                    textStyle="xs"
                                    padding="8px"
                                    color={theme.colors.main.textSubdued}
                                >
                                    {match.player2Char}
                                </Text> */}
                            </Stack>
                        </Flex>
                    </Card.Body>
                    <Card.Footer />
                </Card.Root>
            )}
            <Drawer.Root
                open={detailsOpen}
                onOpenChange={(e) => setDetailsOpen(e.open)}
                size={'xl'}
            >
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content bg={theme.colors.main.card}>
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
                            <Drawer.Body>
                                <Stack>
                                    {selectedMatchDetails &&
                                        selectedMatchDetails.matches &&
                                        selectedMatchDetails.matches.map((match, index) => {
                                            return (
                                                <Box
                                                    display={'flex'}
                                                    borderRadius={'8px'}
                                                    bg={theme.colors.main.secondary}
                                                    padding={'8px'}
                                                    alignItems={'center'}
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
                                                        color={theme.colors.main.textSubdued}
                                                    >
                                                        {match.player1Char}
                                                    </Text>
                                                    <Text
                                                        flex="1"
                                                        textStyle="md"
                                                        padding="8px"
                                                        color={theme.colors.main.textSubdued}
                                                    >
                                                        VS
                                                    </Text>
                                                    <RenderSuperArt code={match.player2Super} />
                                                    <Text
                                                        flex="1"
                                                        textStyle="md"
                                                        padding="8px"
                                                        color={theme.colors.main.textSubdued}
                                                    >
                                                        {match.player2Char}
                                                    </Text>
                                                </Box>
                                            )
                                        })}
                                    {/* {JSON.stringify(selectedMatchDetails)} */}
                                </Stack>
                            </Drawer.Body>
                            <Drawer.Footer>
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton size="sm" />
                                </Drawer.CloseTrigger>
                                <Button variant="outline">Cancel</Button>
                                <Button>Save</Button>
                            </Drawer.Footer>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </Box>
    )
}

export default MatchSetCard
