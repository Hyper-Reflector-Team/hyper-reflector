import { useState } from 'react'
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
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from '../state/store'
import { Check, Moon, Play, Square, Sun, Volume2, VolumeX, X } from 'lucide-react'
import { toaster } from '../components/chakra/ui/toaster'

const MARGIN_SECTION = '12px'

export default function SettingsPage() {
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
    const [soundPlaying, setSoundPlaying] = useState(false)

    const themes = createListCollection({
        items: [
            { label: 'React.js', value: 'react' },
            { label: 'Vue.js', value: 'vue' },
            { label: 'Angular', value: 'angular' },
            { label: 'Svelte', value: 'svelte' },
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
            { label: '8', value: '8' },
            { label: '9', value: '9' },
            { label: '10', value: '10' },
        ],
    })

    const pickSoundFile = async (type: string) => {
        try {
            const res = await open({
                multiple: false,
                directory: false,
                title: 'Select a sound file to use',
                // Optional filter (Windows/macOS/Linux executables)
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
                // Optional filter (Windows/macOS/Linux executables)
                filters: [{ name: 'Executables', extensions: ['exe', 'AppImage', 'bin', 'run'] }],
            })
            console.log('res', res)
            // if (typeof res === 'string') setExePath(res)
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

    return (
        <Stack>
            <Card.Root flex={'1'} overflow="hidden">
                <Card.Body gap="2">
                    <Card.Title>GGPO Settings</Card.Title>
                    <Card.Description>Choose your netplay experience</Card.Description>
                    <Select.Root
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
                            <Button maxW="1/2" onClick={() => pickSoundFile('challenge')}>
                                Set custom challenge sound
                            </Button>
                            <IconButton
                                colorScheme="blue"
                                onClick={() => {
                                    setSoundPlaying(true)
                                    playSound('challenge')
                                }}
                            >
                                <Play />
                            </IconButton>
                            <IconButton
                                colorScheme="blue"
                                onClick={() => {
                                    setSoundPlaying(false)
                                    pauseSound()
                                }}
                            >
                                <Square />
                            </IconButton>
                        </Box>
                    </Stack>
                    <Switch.Root
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
                            <Button maxW="1/2" onClick={() => pickSoundFile('at')}>
                                Set custom @ message sound
                            </Button>
                            <IconButton
                                colorScheme="blue"
                                onClick={() => {
                                    setSoundPlaying(true)
                                    playSound('at')
                                }}
                            >
                                <Play />
                            </IconButton>
                            <IconButton
                                colorScheme="blue"
                                onClick={() => {
                                    setSoundPlaying(false)
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
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        size="lg"
                        checked={darkMode}
                        onCheckedChange={(e) => setDarkMode(e.checked)}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb>
                                <Switch.ThumbIndicator fallback={<Sun color="black" />}>
                                    <Moon />
                                </Switch.ThumbIndicator>
                            </Switch.Thumb>
                        </Switch.Control>
                        <Switch.Label>Mode</Switch.Label>
                    </Switch.Root>
                    <Select.Root
                        marginTop={MARGIN_SECTION}
                        maxW="1/2"
                        key={'test'}
                        variant={'outline'}
                        collection={themes}
                        value={[theme]}
                        onValueChange={(e) => setTheme(e.value[0])}
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
                    <Card.Description></Card.Description>
                    <Button marginTop={MARGIN_SECTION} maxW="1/2" onClick={() => {}}>
                        Set theme
                    </Button>
                </Card.Body>
            </Card.Root>
        </Stack>
    )
}
