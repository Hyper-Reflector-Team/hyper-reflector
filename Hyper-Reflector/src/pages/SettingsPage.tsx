import { useNavigate } from '@tanstack/react-router'
import {
    Stack,
    Button,
    Switch,
    Card,
    Select,
    Portal,
    createListCollection,
    Box,
    IconButton,
    Text,
} from '@chakra-ui/react'
import { logout } from '../utils/firebase'
import { useColorMode } from '../components/chakra/ui/color-mode'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from '../state/store'
import { Check, Moon, Play, Square, Sun, Volume2, VolumeX, X, LogOut } from 'lucide-react'
import { toaster } from '../components/chakra/ui/toaster'

const MARGIN_SECTION = '12px'

export default function SettingsPage() {
    const navigate = useNavigate()
    const { toggleColorMode } = useColorMode()
    const ggpoDelay = useSettingsStore((s) => s.ggpoDelay)
    const setGgpoDelay = useSettingsStore((s) => s.setGgpoDelay)
    const notifChallengeSound = useSettingsStore((s) => s.notifChallengeSound)
    const setNotifChallengeSound = useSettingsStore((s) => s.setNotifChallengeSound)
    const notifChallengeSoundPath = useSettingsStore((s) => s.notifChallengeSoundPath)
    const setNotifChallengeSoundPath = useSettingsStore((s) => s.setNotifChallengeSoundPath)
    const notifiAtSound = useSettingsStore((s) => s.notifiAtSound)
    const setNotifAtSound = useSettingsStore((s) => s.setNotifAtSound)
    const notifAtSoundPath = useSettingsStore((s) => s.notifAtSoundPath)
    const setNotifAtSoundPath = useSettingsStore((s) => s.setNotifAtSoundPath)
    const darkMode = useSettingsStore((s) => s.darkMode)
    const setDarkMode = useSettingsStore((s) => s.setDarkMode)
    const theme = useSettingsStore((s) => s.theme)
    const setTheme = useSettingsStore((s) => s.setTheme)
    const setEmulatorPath = useSettingsStore((s) => s.setEmulatorPath)
    const emulatorPath = useSettingsStore((s) => s.emulatorPath)

    const themes = createListCollection({
        items: [
            {
                label: 'Orange Soda',
                value: 'Orange Soda',
                data: { colorPalette: 'orange', name: 'Orange Soda' },
            },
            {
                label: 'Grape Soda',
                value: 'Grape Soda',
                data: { colorPalette: 'purple', name: 'Grape Soda' },
            },
        ],
    })

    const delays = createListCollection({
        items: [
            { label: '0', value: '0' },
            { label: '1', value: '1' },
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
            { label: '5', value: '5' },
            { label: '6', value: '6' },
            { label: '7', value: '7' },
        ],
    })

    const pickSoundFile = async (type: string) => {
        try {
            const res = await open({
                multiple: false,
                directory: false,
                title: 'Select a sound file to use',
                filters: [{ name: 'Audio', extensions: ['mp3', 'wav'] }],
            })
            if (type === 'challenge') {
                if (typeof res === 'string') {
                    setNotifChallengeSoundPath(res)
                }
            }
            if (type === 'at') {
                if (typeof res === 'string') setNotifAtSoundPath(res)
            }
        } catch (err: any) {
            toaster.error({
                title: 'Error Opening Dialog',
                description: err,
            })
        }
    }

    const pickExe = async () => {
        try {
            const res = await open({
                multiple: false,
                directory: false,
                title: 'Select Emulator Executable',
                filters: [{ name: 'Executables', extensions: ['exe'] }],
            })
            console.log('res', res)
            if (typeof res === 'string') setEmulatorPath(res)
        } catch (err: any) {
            toaster.error({
                title: 'Error Opening Dialog',
                description: err,
            })
        }
    }

    const playSound = async (type: string) => {
        if (type === 'challenge') await invoke('play_sound', { path: notifChallengeSoundPath })
        if (type === 'at') await invoke('play_sound', { path: notifAtSoundPath })
    }

    const pauseSound = async () => {
        await invoke('stop_sound')
    }

    const changeRoute = (route: string) => {
        navigate({ to: route })
    }

    async function logoutHelper() {
        logout()
        changeRoute('/')
    }

    return (
        <Stack>
            <Card.Root flex={'1'} overflow="hidden">
                <Card.Body gap="2">
                    <Card.Title>GGPO Settings</Card.Title>
                    <Card.Description>Choose your netplay experience</Card.Description>
                    <Select.Root
                        colorPalette={theme.colorPalette}
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        key={'test'}
                        variant={'outline'}
                        collection={delays}
                        value={[ggpoDelay]}
                        onValueChange={(e) => setGgpoDelay(e.value[0])}
                    >
                        <Select.HiddenSelect />
                        <Select.Label>Delay - Higher is smoother but more input lag</Select.Label>
                        <Select.Control>
                            <Select.Trigger onChange={() => console.log('change')}>
                                <Select.ValueText placeholder="Select Delay" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                                <Select.Indicator />
                            </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {delays.items.map((d) => (
                                        <Select.Item item={d} key={d.value}>
                                            {d.label}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Card.Body>
            </Card.Root>
            <Card.Root flex={'1'} overflow="hidden">
                <Card.Body gap="2">
                    <Card.Title>Notification Settings</Card.Title>
                    <Card.Description>
                        Choose how the application notifies you of events
                    </Card.Description>
                    <Switch.Root
                        colorPalette={theme.colorPalette}
                        marginTop={MARGIN_SECTION}
                        size="lg"
                        checked={notifChallengeSound}
                        onCheckedChange={(e) => setNotifChallengeSound(e.checked)}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb>
                                <Switch.ThumbIndicator fallback={<X color="black" />}>
                                    <Check />
                                </Switch.ThumbIndicator>
                            </Switch.Thumb>
                        </Switch.Control>
                        {notifChallengeSound ? <Volume2 /> : <VolumeX />}
                        <Switch.Label>Challenge Sound</Switch.Label>
                    </Switch.Root>
                    <Stack>
                        <Text textStyle="xs">{notifChallengeSoundPath}</Text>

                        <Box gap="2" display={'flex'}>
                            <Button
                                colorPalette={theme.colorPalette}
                                maxW="1/2"
                                onClick={() => pickSoundFile('challenge')}
                            >
                                Set custom challenge sound
                            </Button>
                            <IconButton
                                colorPalette={theme.colorPalette}
                                colorScheme="blue"
                                onClick={() => {
                                    playSound('challenge')
                                }}
                            >
                                <Play />
                            </IconButton>
                            <IconButton
                                colorPalette={theme.colorPalette}
                                colorScheme="blue"
                                onClick={() => {
                                    pauseSound()
                                }}
                            >
                                <Square />
                            </IconButton>
                        </Box>
                    </Stack>
                    <Switch.Root
                        colorPalette={theme.colorPalette}
                        marginTop={MARGIN_SECTION}
                        size="lg"
                        checked={notifiAtSound}
                        onCheckedChange={(e) => setNotifAtSound(e.checked)}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb>
                                <Switch.ThumbIndicator fallback={<X color="black" />}>
                                    <Check />
                                </Switch.ThumbIndicator>
                            </Switch.Thumb>
                        </Switch.Control>
                        {notifiAtSound ? <Volume2 /> : <VolumeX />}
                        <Switch.Label>@ Message Sound</Switch.Label>
                    </Switch.Root>
                    <Stack>
                        <Text textStyle="xs">{notifAtSoundPath}</Text>
                        <Box gap="2" display={'flex'}>
                            <Button
                                colorPalette={theme.colorPalette}
                                maxW="1/2"
                                onClick={() => pickSoundFile('at')}
                            >
                                Set custom @ message sound
                            </Button>
                            <IconButton
                                colorPalette={theme.colorPalette}
                                colorScheme="blue"
                                onClick={() => {
                                    playSound('at')
                                }}
                            >
                                <Play />
                            </IconButton>
                            <IconButton
                                colorPalette={theme.colorPalette}
                                colorScheme="blue"
                                onClick={() => {
                                    pauseSound()
                                }}
                            >
                                <Square />
                            </IconButton>
                        </Box>
                    </Stack>
                </Card.Body>
            </Card.Root>
            <Card.Root overflow="hidden" flex={'1'}>
                <Card.Body gap="2">
                    <Card.Title>Theme Settings</Card.Title>
                    <Card.Description>Change the visual style of the application</Card.Description>
                    <Switch.Root
                        colorPalette={theme.colorPalette}
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        size="lg"
                        checked={darkMode}
                        onCheckedChange={(e) => {
                            setDarkMode(e.checked)
                            // This delay prevents a weird animation issue
                            setTimeout(() => {
                                toggleColorMode()
                            }, 100)
                        }}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb>
                                <Switch.ThumbIndicator fallback={<Moon color="black" />}>
                                    <Sun />
                                </Switch.ThumbIndicator>
                            </Switch.Thumb>
                        </Switch.Control>
                        <Switch.Label>Mode</Switch.Label>
                    </Switch.Root>
                    <Select.Root
                        colorPalette={theme.colorPalette}
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        key={'test'}
                        variant={'outline'}
                        collection={themes}
                        value={[theme.name]}
                        onValueChange={(e) => {
                            setTheme(e.items[0].data)
                        }}
                    >
                        <Select.HiddenSelect />
                        <Select.Label>Select Theme</Select.Label>
                        <Select.Control>
                            <Select.Trigger>
                                <Select.ValueText placeholder="Select Theme" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                                <Select.Indicator />
                            </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {themes.items.map((t) => (
                                        <Select.Item item={t} key={t.value}>
                                            {t.label}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Card.Body>
            </Card.Root>
            <Card.Root overflow="hidden" flex={'1'}>
                <Card.Body gap="2">
                    <Card.Title>Emulator Settings</Card.Title>
                    <Card.Description>
                        Warning this is deprecated and will be removed
                    </Card.Description>
                    <Text textStyle="xs">{emulatorPath}</Text>
                    <Button
                        colorPalette={'red'}
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        onClick={pickExe}
                    >
                        Set Custom Emulator Path
                    </Button>
                </Card.Body>
            </Card.Root>
            <Card.Root overflow="hidden" flex={'1'}>
                <Card.Body gap="2">
                    <Card.Title>Danger</Card.Title>
                    <Card.Description></Card.Description>
                    <Button
                        disabled
                        colorPalette={'red'}
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        onClick={() => console.log('need to implement')}
                    >
                        Reset to default
                    </Button>
                    <Text textStyle="xs">Log out user</Text>
                    <IconButton
                        colorPalette={'red'}
                        width={'40px'}
                        height={'40px'}
                        onClick={logoutHelper}
                        aria-label="Logout"
                    >
                        <LogOut />
                    </IconButton>
                </Card.Body>
            </Card.Root>
        </Stack>
    )
}
