import { create } from 'zustand'

interface Lobby {
    name: string
    id: number
    pass: string | null
    isPrivate: boolean
    users: number
}

interface Message {
    id: string | number
    content: string
    [key: string]: any
}

interface Call {
    callerId: string
    [key: string]: any
}

interface MessageState {
    currentLobbyState: Lobby
    setCurrentLobbyState: (lobby: Lobby) => void
    currentLobbiesState: Lobby[]
    setCurrentLobbiesState: (lobbies: Lobby[]) => void
    messageState: Message[]
    updateMessage: (message: Message) => void
    pushMessage: (message: Message) => void
    clearMessageState: () => void
    userList: string[]
    setUsersList: (users: string[]) => void
    pushUser: (user: string) => void
    removeUser: (user: string) => void
    clearUserList: () => void
    callData: Call[]
    setCallData: (call: Call) => void
    removeCallData: (callRef: Call) => void
    clearCallData: () => void
}

export const useMessageStore = create<MessageState>((set) => ({
    currentLobbyState: { name: 'Hyper Reflector', id: 0, pass: null, isPrivate: false, users: 1 },
    setCurrentLobbyState: (lobby) => set({ currentLobbyState: lobby }),
    currentLobbiesState: [
        { name: 'Hyper Reflector', id: 0, pass: null, isPrivate: false, users: 1 },
    ],
    setCurrentLobbiesState: (lobbies) => set({ currentLobbiesState: lobbies }),
    messageState: [],
    updateMessage: (message) =>
        set((state) => ({
            messageState: state.messageState.map((msg) => (msg.id === message.id ? message : msg)),
        })),
    pushMessage: (message) => set((state) => ({ messageState: [...state.messageState, message] })),
    clearMessageState: () => set({ messageState: [] }),
    userList: [],
    setUsersList: (users) => set({ userList: [...users] }),
    pushUser: (user) => set((state) => ({ userList: [...state.userList, user] })),
    removeUser: (user) => set((state) => ({ userList: state.userList.filter((u) => u !== user) })),
    clearUserList: () => set({ userList: [] }),
    callData: [],
    setCallData: (call) => set((state) => ({ callData: [...state.callData, call] })),
    removeCallData: (callRef) =>
        set((state) => ({
            callData: state.callData.filter((c) => c.callerId !== callRef.callerId),
        })),
    clearCallData: () => set({ callData: [] }),
}))
