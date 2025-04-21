import { useEffect, useState } from 'react'
import { Button, Stack, Text, Heading, createListCollection, Box } from '@chakra-ui/react'
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '../components/chakra/ui/select'
import { useLoginStore } from '../state/store'
import theme from '../utils/theme'
import SideBar from '../components/general/SideBar'
import { UserRound } from 'lucide-react'

export default function SettingsPage() {
    const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
    const [currentTab, setCurrentTab] = useState<number>(0)
    const [currentEmuPath, setCurrentEmuPath] = useState('')
    const [currentDelay, setCurrentDelay] = useState('')

    const delays = createListCollection({
        items: [
            { label: 'Delay 0', value: '0' },
            { label: 'Delay 1', value: '1' },
            { label: 'Delay 2', value: '2' },
            { label: 'Delay 3', value: '3' },
            { label: 'Delay 4', value: '4' },
            { label: 'Delay 5', value: '5' },
            { label: 'Delay 6', value: '6' },
            { label: 'Delay 7', value: '7' },
        ],
    })

    const handleSetPath = (path: string) => {
        setCurrentEmuPath(path)
    }

    const handleSetDelay = (delay: string) => {
        setCurrentDelay(delay)
    }

    useEffect(() => {
        window.api.getEmulatorDelay()
        window.api.getEmulatorPath()
    }, [])

    useEffect(() => {
        window.api.removeExtraListeners('emulatorPath', handleSetPath)
        window.api.on('emulatorPath', handleSetPath)

        window.api.removeExtraListeners('emulatorDelay', handleSetDelay)
        window.api.on('emulatorDelay', handleSetDelay)

        return () => {
            window.api.removeListener('emulatorPath', handleSetPath)
            window.api.removeListener('emulatorDelay', handleSetDelay)
        }
    }, [])

    return (
        <Box display="flex" gap="12px">
            <SideBar width="160px">
                <Button
                    disabled={currentTab === 0}
                    justifyContent="flex-start"
                    bg={theme.colors.main.secondary}
                    onClick={() => setCurrentTab(0)}
                >
                    <UserRound />
                    Application
                </Button>

                <Button
                    disabled={currentTab === 1}
                    justifyContent="flex-start"
                    bg={theme.colors.main.secondary}
                    onClick={() => setCurrentTab(1)}
                >
                    <UserRound />
                    Online Settings
                </Button>

                <Button
                    disabled={currentTab === 2}
                    justifyContent="flex-start"
                    bg={theme.colors.main.secondary}
                    onClick={() => setCurrentTab(2)}
                >
                    <UserRound />
                    Danger
                </Button>
            </SideBar>
            <Stack flex="1">
                {currentTab === 0 && (
                    <Box>
                        <Heading flex="0" size="md" color={theme.colors.main.textSubdued}>
                            Application Settings
                        </Heading>
                        <Stack>
                            <Text textStyle="xs" color={theme.colors.main.textMedium}>
                                This is where we can set our emulator path and other setting
                            </Text>
                            <Button
                                bg={theme.colors.main.actionSecondary}
                                onClick={() => {
                                    window.api.setEmulatorPath()
                                }}
                            >
                                Set Emulator Path
                            </Button>
                            <Text textStyle="xs" color={theme.colors.main.textMedium}>
                                Current Path: {currentEmuPath}
                            </Text>
                        </Stack>
                    </Box>
                )}
                {currentTab === 1 && (
                    <Box>
                        <Heading flex="0" size="md" color={theme.colors.main.textSubdued}>
                            Online Settings
                        </Heading>
                        <Stack>
                            <Text textStyle="xs" color={theme.colors.main.textMedium}>
                                Online Delay
                            </Text>
                            <SelectRoot
                                color={theme.colors.main.actionSecondary}
                                collection={delays}
                                value={[currentDelay]}
                                onValueChange={(e) => {
                                    handleSetDelay(e.value[0])
                                    window.api.setEmulatorDelay(e.value[0])
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValueText placeholder="Select Delay" />
                                </SelectTrigger>
                                <SelectContent>
                                    {delays.items.map((delay) => (
                                        <SelectItem item={delay} key={delay.value}>
                                            {delay.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                            <Text textStyle="xs" color={theme.colors.main.textMedium}>
                                Current delay: {currentDelay}
                            </Text>
                        </Stack>
                    </Box>
                )}
                {currentTab === 2 && isLoggedIn && (
                    <Box>
                        <Heading flex="0" size="md" color={theme.colors.main.textSubdued}>
                            Danger Settings
                        </Heading>
                        <Stack>
                            <Text textStyle="xs" color={theme.colors.main.textMedium}>
                                Log out user, this will also make it so you do not automaitcally log
                                in on start next time.
                            </Text>

                            <Button
                                colorPalette="red"
                                onClick={() => {
                                    window.api.logOutUser()
                                }}
                            >
                                Log Out
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Stack>
        </Box>
    )
}
