import { invoke } from '@tauri-apps/api/core'
import { Box, Button, Card, IconButton, Text } from '@chakra-ui/react'
import { open } from '@tauri-apps/plugin-dialog'
import { toaster } from '../components/chakra/ui/toaster'
import { useSettingsStore } from '../state/store'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LabPage() {
    const { t } = useTranslation()
    const theme = useSettingsStore((s) => s.theme)
    const setTrainingPath = useSettingsStore((s) => s.setTrainingPath)
    const trainingPath = useSettingsStore((s) => s.trainingPath)

    async function handleStartTraining() {
        const luaPath =
            'C:\\Users\\dusti\\Desktop\\hyper-reflector\\src\\lua\\3rd_training_lua\\3rd_training.lua'
        await invoke('start_training_mode', {
            useSidecar: false,
            exePath:
                'C:\\Users\\dusti\\Desktop\\hyper-reflector\\Hyper-Reflector\\emu\\hyper-screw-fbneo\\fs-fbneo.exe',
            args: ['--rom', 'sfiii3nr1', '--lua', `${trainingPath || luaPath}`],
        })
    }

    const pickLua = async () => {
        try {
            const res = await open({
                multiple: false,
                directory: false,
                title: t('Lab.dialogLua'),
                filters: [{ name: 'Lua scripts', extensions: ['lua', 'luac'] }],
            })
            console.log('res', res)
            if (typeof res === 'string') setTrainingPath(res)
        } catch (err: any) {
            toaster.error({
                title: t('Lab.errorPath'),
                description: err,
            })
        }
    }

    return (
        <div>
            <Card.Root overflow="hidden" flex={'1'}>
                <Card.Body gap="2">
                    <Card.Title>{t('Lab.title')}</Card.Title>
                    <Button
                        colorPalette={theme.colorPalette}
                        maxW="1/2"
                        onClick={handleStartTraining}
                    >
                        {t('Lab.start')}
                    </Button>
                    <Text textStyle="xs">
                        {t('Lab.currentPath')} {trainingPath || 'Default'}
                    </Text>
                    <Box display="flex" gap="2">
                        <Button colorPalette={theme.colorPalette} maxW="1/2" onClick={pickLua}>
                            {t('Lab.setLua')}
                        </Button>
                        {trainingPath && (
                            <IconButton
                                colorPalette={'red'}
                                colorScheme="blue"
                                onClick={() => {
                                    setTrainingPath('')
                                }}
                            >
                                <Trash2 />
                            </IconButton>
                        )}
                    </Box>
                </Card.Body>
            </Card.Root>
        </div>
    )
}
