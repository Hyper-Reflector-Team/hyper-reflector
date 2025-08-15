import { useLoginStore } from '@features/common/state'
import { useEffect } from 'react'
import UsersChat from '@features/lobby/components/UsersChat'

export default function UsersPanel() {
    const userState = useLoginStore((state) => state.userState)
    const updateUserState = useLoginStore((state) => state.updateUserState)

    const handleUpdateUser = (data) => {
        window.api.getConfigValue('isAway')

        if (data?.isNewPing) {
            const updatedPings =
                userState?.lastKnownPings?.filter((peer) => peer.id !== data.id) ?? []
            updatedPings.push(data)
            updateUserState({
                ...userState,
                lastKnownPings: updatedPings,
            })
        } else {
            updateUserState({
                ...userState,
                ...data,
            })
        }
    }

    useEffect(() => {
        window.api.removeExtraListeners('updateUserData', handleUpdateUser)
        window.api.on('updateUserData', handleUpdateUser)

        return () => {
            window.api.removeListener('updateUserData', handleUpdateUser)
        }
    }, [userState])

    return <UsersChat />
}
