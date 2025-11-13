import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Flex, Image, Stack, Text } from '@chakra-ui/react'
import { Trophy, XCircle } from 'lucide-react'
import type { MiniGameChoice, MiniGameUiState } from './types'
import { RPS_OPTIONS } from './rps'
import {
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
} from '../components/chakra/ui/dialog'

type MiniGameArenaProps = {
    viewerId?: string
    state: MiniGameUiState | null
    opponentName?: string
    onSubmitChoice: (choice: MiniGameChoice) => void
    onDecline: () => void
    onClose: () => void
    onChooseSide?: (side: 'player1' | 'player2') => Promise<void> | void
    sideSelectionPending?: boolean
}

export default function MiniGameArena({
    viewerId,
    state,
    opponentName,
    onSubmitChoice,
    onDecline,
    onClose,
    onChooseSide,
    sideSelectionPending,
}: MiniGameArenaProps) {
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (!state) return
        const tick = () => {
            const remaining = Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000))
            setCountdown(remaining)
        }
        tick()
        const id = window.setInterval(tick, 250)
        return () => window.clearInterval(id)
    }, [state])

    const result = state?.result ?? null
    const hasResult = Boolean(result)
    const viewerIsWinner = result?.winnerUid === viewerId
    const viewerIsLoser = result?.loserUid === viewerId
    const showSideSelection =
        hasResult &&
        viewerIsWinner &&
        onChooseSide &&
        state?.result?.outcome === 'win' &&
        state.mode === 'live' &&
        !state.sidePreferenceSubmitted

    const title = useMemo(() => {
        if (!state) return ''
        if (hasResult) {
            if (result?.outcome === 'draw') return 'Duel Draw'
            if (result?.outcome === 'declined') return 'Challenge Declined'
            if (viewerIsWinner) return 'Victory!'
            if (viewerIsLoser) return 'Defeat'
            return 'Duel Result'
        }
        return 'Rock Paper Scissors Duel'
    }, [state, hasResult, viewerIsWinner, viewerIsLoser])

    if (!state) {
        return null
    }

    const waitingForOpponent = state.status === 'submitted' && !hasResult
    const controlsDisabled = state.status !== 'pending' || waitingForOpponent

    const renderResultSummary = () => {
        if (!result) return null
        const challengerChoice = result.choices[state.challengerId] || null
        const opponentChoice = result.choices[state.opponentId] || null
        return (
            <Stack gap="2" mt="3">
                <Flex justify="space-between">
                    <Text fontWeight="semibold">You chose:</Text>
                    <Text>
                        {humanizeChoice(state.challengerId === viewerId ? challengerChoice : opponentChoice)}
                    </Text>
                </Flex>
                <Flex justify="space-between">
                    <Text fontWeight="semibold">Opponent chose:</Text>
                    <Text>
                        {humanizeChoice(state.challengerId === viewerId ? opponentChoice : challengerChoice)}
                    </Text>
                </Flex>
                {result.ratings && viewerId && result.ratings[viewerId] ? (
                    <Flex justify="space-between" mt="2">
                        <Text fontWeight="semibold">Your RPS ELO:</Text>
                        <Text>{result.ratings[viewerId]}</Text>
                    </Flex>
                ) : null}
            </Stack>
        )
    }

    return (
        <DialogRoot open={Boolean(state)} onOpenChange={(details) => !details.open && onClose()}>
            <DialogContent bg="gray.900" color="white" maxW="560px">
                <DialogHeader>
                    <Flex align="center" gap="2">
                        {hasResult ? <Trophy size={20} /> : null}
                        <Text>{title}</Text>
                    </Flex>
                </DialogHeader>
                <DialogBody>
                    {!hasResult || !result ? (
                        <Stack gap="4">
                            <Box bg="gray.700" borderRadius="full" h="2">
                                <Box
                                    bg="orange.400"
                                    h="100%"
                                    borderRadius="full"
                                    transition="width 0.2s linear"
                                    width={`${Math.min(
                                        100,
                                        Math.max(0, ((10 - countdown) / 10) * 100)
                                    )}%`}
                                />
                            </Box>
                            <Text textAlign="center" fontSize="sm" color="gray.300">
                                {waitingForOpponent
                                    ? 'Waiting for your opponent...'
                                    : `Make your choice within ${countdown}s`}
                            </Text>
                            <Flex justify="space-between" gap="3">
                                {RPS_OPTIONS.map((option) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        isDisabled={controlsDisabled}
                                        isSelected={state.viewerChoice === option.id}
                                        onSelect={() => onSubmitChoice(option.id)}
                                    />
                                ))}
                            </Flex>
                        </Stack>
                    ) : (
                        <>
                            <Text fontSize="sm" color="gray.300">
                                {result.outcome === 'draw'
                                    ? 'Both players picked the same option.'
                                    : result.outcome === 'declined'
                                      ? 'The challenge was declined.'
                                      : viewerIsWinner
                                        ? 'You won the duel!'
                                        : viewerIsLoser
                                          ? 'You lost this duel.'
                                          : 'The duel has concluded.'}
                            </Text>
                            {renderResultSummary()}
                        </>
                    )}
                </DialogBody>
                <DialogFooter>
                    {!hasResult || !result ? (
                        <Flex w="100%" justify="flex-end">
                            <Button
                                variant="subtle"
                                onClick={onDecline}
                            >
                                <Flex align="center" gap="2">
                                    <XCircle size={16} />
                                    {state.isInitiator ? 'Cancel duel' : 'Decline'}
                                </Flex>
                            </Button>
                        </Flex>
                    ) : showSideSelection ? (
                        <Stack w="100%" gap="3">
                            <Text fontSize="sm" color="gray.300">
                                You won the duel! Choose the side you’d like to start on for the next match
                                against {opponentName || 'this opponent'}. This preference lasts 1 hour.
                            </Text>
                            <Flex w="100%" justify="space-between" gap="3">
                                <Button
                                    colorPalette="orange"
                                    flex="1"
                                    loading={sideSelectionPending}
                                    onClick={() => onChooseSide?.('player1')}
                                >
                                    Claim Player 1
                                </Button>
                                <Button
                                    colorPalette="purple"
                                    flex="1"
                                    loading={sideSelectionPending}
                                    onClick={() => onChooseSide?.('player2')}
                                >
                                    Claim Player 2
                                </Button>
                            </Flex>
                        </Stack>
                    ) : (
                        <Button onClick={onClose} width="full">
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}

function OptionCard({
    option,
    isSelected,
    isDisabled,
    onSelect,
}: {
    option: (typeof RPS_OPTIONS)[number]
    isSelected: boolean
    isDisabled: boolean
    onSelect: () => void
}) {
    return (
        <Button
            flex="1"
            variant={isSelected ? 'solid' : 'outline'}
            colorPalette={isSelected ? 'orange' : 'gray'}
            onClick={onSelect}
            disabled={isDisabled}
            display="flex"
            flexDirection="column"
            gap="2"
            height="auto"
            py="4"
        >
            <Image src={option.image} alt={option.label} boxSize="48px" objectFit="contain" />
            <Text fontWeight="semibold">{option.label}</Text>
            <Text fontSize="xs" color="gray.300" textAlign="center">
                {option.description}
            </Text>
        </Button>
    )
}

function humanizeChoice(choice?: MiniGameChoice | null) {
    if (!choice) return '\u2014'
    return choice.charAt(0).toUpperCase() + choice.slice(1)
}


