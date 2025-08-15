import { Stack, Box, Clipboard, IconButton } from '@chakra-ui/react'
import ChatWindow from '../components/ChatWindow'
import ChatBar from '../components/ChatBar'
import { ClipboardCopy } from 'lucide-react'
import { useLayoutStore, useMessageStore } from '@features/common/state'

export default function ChatSection() {
    const theme = useLayoutStore((state) => state.appTheme)
    const currentLobbyState = useMessageStore((state) => state.currentLobbyState)

    return (
        <Stack flex="max-content" minH="100%" overflow="hidden" gap="12px">
            {/* Header del chat con nombre del lobby y botón para copiar contraseña */}
            <Box
                marginLeft="12px"
                textStyle="xs"
                color={theme.colors.main.action}
                display="flex"
                alignItems="center"
                gap={'32px'}
                height={'24px'}
            >
                {currentLobbyState?.name || ''}
                {currentLobbyState?.isPrivate && (
                    <Clipboard.Root
                        value={currentLobbyState?.pass || 'eeeee'}
                        color={theme.colors.main.action}
                    >
                        <Clipboard.Trigger asChild>
                            <IconButton
                                variant="subtle"
                                size="xs"
                                bg={theme.colors.main.bg}
                                color={theme.colors.main.action}
                            >
                                <ClipboardCopy />
                                copy password
                            </IconButton>
                        </Clipboard.Trigger>
                    </Clipboard.Root>
                )}
            </Box>

            {/* Ventana principal del chat */}
            <ChatWindow />

            {/* Barra de entrada de mensajes */}
            <ChatBar />
        </Stack>
    )
}
