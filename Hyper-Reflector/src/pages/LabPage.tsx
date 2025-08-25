import { invoke } from '@tauri-apps/api/core'
import { Button, Card, Switch } from '@chakra-ui/react'
import { Check, X } from 'lucide-react'

export default function LabPage() {
    async function handleStartTraining() {
        const luaPath =
            'C:\\Users\\dusti\\Desktop\\hyper-reflector\\src\\lua\\3rd_training_lua\\3rd_training.lua'
        await invoke('start_training_mode', {
            useSidecar: false,
            exePath:
                'C:\\Users\\dusti\\Desktop\\hyper-reflector\\Hyper-Reflector\\emu\\hyper-screw-fbneo\\fs-fbneo.exe',
            args: ['--rom', 'sfiii3nr1', '--lua', `${luaPath}`],
        })
    }

    return (
        <div>
            <div>Lab page</div>
            <Button onClick={handleStartTraining}>Start Training</Button>
            <Card.Root flex={'1'} overflow="hidden">
                <Card.Body gap="2">
                    <Card.Title>Notification Settings</Card.Title>
                    <Card.Description>
                        Choose how the application notifies you of events.
                    </Card.Description>
                    <Switch.Root size="lg">
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb>
                                <Switch.ThumbIndicator fallback={<X color="black" />}>
                                    <Check />
                                </Switch.ThumbIndicator>
                            </Switch.Thumb>
                        </Switch.Control>
                        <Switch.Label>Challenge Sound</Switch.Label>
                    </Switch.Root>
                    <Button maxW="1/2" onClick={() => console.log('test')}>
                        Set custom challenge sound
                    </Button>
                    <Switch.Root size="lg">
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb>
                                <Switch.ThumbIndicator fallback={<X color="black" />}>
                                    <Check />
                                </Switch.ThumbIndicator>
                            </Switch.Thumb>
                        </Switch.Control>
                        <Switch.Label>@ Message Sound</Switch.Label>
                    </Switch.Root>
                    <Button maxW="1/2" onClick={() => console.log('test')}>
                        Set custom message sound
                    </Button>
                </Card.Body>
            </Card.Root>
        </div>
    )
}
