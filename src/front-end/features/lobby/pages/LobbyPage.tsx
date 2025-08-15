import { Box } from '@chakra-ui/react'
import { useLoginStore, useMessageStore } from '@features/common/state'
import ChatSection from '@features/lobby/components/ChatSection'
import LobbiesPanel from '@features/lobby/components/LobbyPanel'
import UsersPanel from '@features/lobby/components/UsersPanel'
import { useEffect } from 'react'

export default function LobbyPage() {
    const userState = useLoginStore((state) => state.userState)
    const updateUserState = useLoginStore((state) => state.updateUserState)
    const clearMessageState = useMessageStore((state) => state.clearMessageState)
    const currentLobbyState = useMessageStore((state) => state.currentLobbyState)

    // Función que se ejecuta cuando cambia el lobby
    const handleLobbyChange = (newLobby) => {
        // Lógica que estaba en el useEffect original
        if (newLobby && newLobby.name.length) {
            window.api.userChangeLobby({
                newLobbyId: newLobby.name,
                pass: newLobby.pass || '',
                isPrivate: newLobby.isPrivate,
                user: userState,
            })

            // Actualizar el estado del usuario con el lobby actual
            updateUserState({
                ...userState,
                currentLobbyId: newLobby.name,
            })

            // Limpiar el estado de mensajes al cambiar de lobby
            clearMessageState()

            // Verificar el estado de "away"
            window.api.getConfigValue('isAway')
        }
    }

    // Effect para manejar cambios en el lobby actual
    useEffect(() => {
        if (!currentLobbyState || !currentLobbyState.name) {
            const defaultLobby = { name: 'General', isPrivate: false }
            handleLobbyChange(defaultLobby)
        } else if (userState.currentLobbyId !== currentLobbyState.name) {
            handleLobbyChange(currentLobbyState)
        }
    }, [currentLobbyState, userState.currentLobbyId])

    return (
        <Box height="100%" display="flex" width="100%">
            {/* Lobbies Panel */}
            <Box
                minWidth="200px"
                maxWidth="300px"
                flexShrink={0} // No se reduce
            >
                <LobbiesPanel onLobbyChange={handleLobbyChange} />
            </Box>

            <ChatSection />

            {/* Users Panel - ancho fijo */}
            <Box
                maxWidth="320px"
                flexShrink={0} // No se reduce
            >
                <UsersPanel />
            </Box>
        </Box>
    )
}
