import { Box, Stack } from '@chakra-ui/react'
import { useLoginStore, useMessageStore } from '@features/common/state'
import UserCard from '@features/lobby/components/UserCard'
import { useEffect } from 'react'

export default function UsersChat() {
    const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
    const userState = useLoginStore((state) => state.userState)
    const userList = useMessageStore((state) => state.userList)
    const setUsersList = useMessageStore((state) => state.setUsersList)
    const addUser = useMessageStore((state) => state.pushUser)
    const removeUser = useMessageStore((state) => state.removeUser)
    const clearUserList = useMessageStore((state) => state.clearUserList)
    const setCallData = useMessageStore((state) => state.setCallData)
    const callData = useMessageStore((state) => state.callData)

    // user has joined lobby
    const handleUserJoinGroup = (users) => {
        clearUserList()
        // sets the list of users from the websocket server
        setUsersList(users)
    }

    const handleUserJoin = (user) => {
        addUser(user)
    }

    // user leaves lobby
    const handleUserLeave = (user) => {
        removeUser(user)
    }

    const handleReceiveCall = (data) => {
        if (!callData.find((c) => c.callerId === data.callerId)) {
            setCallData(data)
        }
    }

    // get users from websockets
    useEffect(() => {
        window.api.removeAllListeners('room-users-add-group', handleUserJoinGroup)
        window.api.on('room-users-add-group', handleUserJoinGroup)
        return () => {
            window.api.removeListener('room-users-add-group', handleUserJoinGroup)
        }
    }, [])

    useEffect(() => {
        window.api.removeAllListeners('room-users-add', handleUserJoin)
        window.api.on('room-users-add', handleUserJoin)
        return () => {
            window.api.removeListener('room-users-add', handleUserJoin)
        }
    }, [])

    useEffect(() => {
        window.api.removeAllListeners('room-users-remove', handleUserLeave)
        window.api.on('room-users-remove', handleUserLeave)
        return () => {
            window.api.removeListener('room-users-remove', handleUserLeave)
        }
    }, [])

    //get challenge requests
    useEffect(() => {
        window.api.removeAllListeners('receivedCall', handleReceiveCall)
        window.api.on('receivedCall', handleReceiveCall)
        return () => {
            window.api.removeListener('receivedCall', handleReceiveCall)
        }
    }, [])

    const renderUsers = () => {
        return userList.map((user) => {
            return <UserCard key={user.uid} user={user} />
        })
    }

    return (
        isLoggedIn && (
            <Box width={'320px'} height={'100%'} scrollbar="hidden" overflowY="scroll">
                <Stack gap="8px">{renderUsers()}</Stack>
            </Box>
        )
    )
}
