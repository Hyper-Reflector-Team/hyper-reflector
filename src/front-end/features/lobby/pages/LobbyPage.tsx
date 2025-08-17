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


    const handleLobbyChange = (newLobby) => {
        if (newLobby && newLobby.name.length) {
            window.api.userChangeLobby({
                newLobbyId: newLobby.name,
                pass: newLobby.pass || '',
                isPrivate: newLobby.isPrivate,
                user: userState,
            })
            updateUserState({
                ...userState,
                currentLobbyId: newLobby.name,
            })
            clearMessageState()
            window.api.getConfigValue('isAway')
        }
    }
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
            <Box
                minWidth="200px"
                maxWidth="300px"
                flexShrink={0} 
            >
                <LobbiesPanel onLobbyChange={handleLobbyChange} />
            </Box>

            <ChatSection />

            <Box
                maxWidth="320px"
                flexShrink={0} 
            >
                <UsersPanel />
            </Box>
        </Box>
    )
}
