import { useState } from 'react'
import { Button, Stack, Input, Text, Heading, Flex, createListCollection } from '@chakra-ui/react'
import {
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '../components/chakra/ui/select'
import { Field } from '../components/chakra/ui/field'
import theme from '../utils/theme'

export default function OfflinePage() {
    const [player, setPlayer] = useState('')
    const [opponentPort, setOpponentPort] = useState('')
    const [opponentIp, setOpponentIp] = useState('')
    const [myPort, setMyPort] = useState('')

    const players = createListCollection({
        items: [
            { label: 'Player 1', value: '0' },
            { label: 'Player 2', value: '1' },
        ],
    })

    return (
        <Stack gap={8}>
            <Stack>
                <Heading size="md" color={theme.colors.main.textSubdued}>
                    Play Offline
                </Heading>
                <Button
                    bg={theme.colors.main.actionSecondary}
                    onClick={() => window.api.startSoloTraining()}
                >
                    Training Mode
                </Button>
            </Stack>
            <Stack>
                <Heading size="sm" color={theme.colors.main.textSubdued}>
                    Manual Connection
                </Heading>
                <Text textStyle="xs" color={theme.colors.main.textMedium}>
                    Used for bypassing the online server and playing with someone directly.
                </Text>
                <Text textStyle="xs" color={theme.colors.main.textMedium}>
                    Make sure both players create a long 8 digit code to connect to eachother. This
                    is an early feature, so there are bound to be issues.
                </Text>
                <Flex gap="2">
                    <Field
                        label="Player"
                        helperText="The side you wish to play on, both users must be on opposite sides."
                        color={theme.colors.main.textMedium}
                    >
                        <SelectRoot
                            color={theme.colors.main.actionSecondary}
                            collection={players}
                            value={[player]}
                            onValueChange={(e) => setPlayer(e.value[0])}
                        >
                            <SelectTrigger>
                                <SelectValueText placeholder="Select Player" />
                            </SelectTrigger>
                            <SelectContent>
                                {players.items.map((player) => (
                                    <SelectItem item={player} key={player.value}>
                                        {player.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </Field>
                    <Field
                        label="Player Code"
                        helperText="Send this to your opponent, atleast 8 characters"
                        color={theme.colors.main.textMedium}
                    >
                        <Input
                            bg={theme.colors.main.textSubdued}
                            color={theme.colors.main.bg}
                            min={8}
                            max={16}
                            type="text"
                            value={myPort}
                            onChange={(e) => setMyPort(e.target.value)}
                            placeholder="Bobby789"
                        />
                    </Field>
                    <Field
                        label="Opponent Code"
                        helperText="The Code of your opponent, atleast 8 characters"
                        color={theme.colors.main.textMedium}
                    >
                        <Input
                            bg={theme.colors.main.textSubdued}
                            color={theme.colors.main.bg}
                            min={8}
                            max={16}
                            type="text"
                            value={opponentPort}
                            onChange={(e) => setOpponentPort(e.target.value)}
                            placeholder="Blake123"
                        />
                    </Field>
                </Flex>
                <Flex gap="8">
                    {/* <Field label="Remote Port" helperText="Your opponent's public IP address.">
                        <Input
                            type="text"
                            value={opponentIp}
                            onChange={(e) => setOpponentIp(e.target.value)}
                            placeholder="127.0.0.1"
                        />
                    </Field> */}
                    <Button
                        bg={theme.colors.main.actionSecondary}
                        disabled={opponentPort.length < 8 || !player || myPort.length < 8}
                        alignSelf="center"
                        onClick={() => {
                            console.log('starting match offline')
                            // TODO rename everything
                            window.api.startGameOnline(opponentPort, player, myPort)
                        }}
                    >
                        Connect
                    </Button>
                </Flex>
            </Stack>
        </Stack>
    )
}
