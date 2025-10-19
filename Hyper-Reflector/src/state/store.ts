import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TUser } from '../types/user'

const MAX_CHAT_MESSAGES = 50

type SettingsState = {
    ggpoDelay: string
    setGgpoDelay: (d: string) => void
    notifChallengeSound: boolean
    setNotifChallengeSound: (on: boolean) => void
    notifChallengeSoundPath: string
    setNotifChallengeSoundPath: (path: string) => void
    notifiAtSound: boolean
    setNotifAtSound: (on: boolean) => void
    notifAtSoundPath: string
    setNotifAtSoundPath: (path: string) => void
    darkMode: boolean
    setDarkMode: (on: boolean) => void
    theme: { colorPalette: string, name: string }
    setTheme: (t: { colorPalette: string, name: string }) => void
    emulatorPath: string
    setEmulatorPath: (path: string) => void
    trainingPath: string
    setTrainingPath: (path: string) => void
    appLanguage: string
    setAppLanguage: (code: string) => void
}

type SignalStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

type UserState = {
    globalUser: TUser | undefined
    globalLoggedIn: boolean
    lobbyUsers: TUser[]
    signalStatus: SignalStatus
    setGlobalUser: (user: TUser | undefined) => void
    setGlobalLoggedIn: (info: boolean) => void
    setLobbyUsers: (users: TUser[]) => void
    setSignalStatus: (status: SignalStatus) => void
}

type TMessage = {
    id: string
    role: 'user' | 'system' | 'challenge'
    text: string
    timeStamp: number
    status?: 'sending' | 'sent' | 'failed'
    userName?: string
}

type MessageState = {
    chatMessages: TMessage[]
    addChatMessage: (msg: TMessage) => void
    addBatch: (msgs: TMessage[]) => void
    updateMessage: (id: string, patch: Partial<TMessage>) => void
    removeMessage: (id: string) => void
    clear: () => void
}

const trimMessages = (messages: TMessage[]) =>
    messages.length > MAX_CHAT_MESSAGES ? messages.slice(-MAX_CHAT_MESSAGES) : messages

export const useMessageStore = create<MessageState>()((set) => ({
    chatMessages: [],
    addChatMessage: (msg) =>
        set((s) => ({ chatMessages: trimMessages([...s.chatMessages, msg]) })),
    addBatch: (msgs) =>
        set((s) => ({ chatMessages: trimMessages([...s.chatMessages, ...msgs]) })),
    updateMessage: (id, patch) =>
        set((s) => ({
            chatMessages: s.chatMessages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
    removeMessage: (id) =>
        set((s) => ({ chatMessages: s.chatMessages.filter((m) => m.id !== id) })),
    clear: () => set({ chatMessages: [] }),
}))

export const useUserStore = create<UserState>((set) => ({
    globalUser: undefined,
    globalLoggedIn: false,
    lobbyUsers: [],
    signalStatus: 'disconnected',
    setGlobalUser: (user) => set({ globalUser: user }),
    setGlobalLoggedIn: (info) => set({ globalLoggedIn: info }),
    setLobbyUsers: (users) => set({ lobbyUsers: users }),
    setSignalStatus: (status) => set({ signalStatus: status }),
}))


export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ggpoDelay: '0',
            setGgpoDelay: (d) => set({ ggpoDelay: d }),
            notifChallengeSound: true,
            setNotifChallengeSound: (on) => set({ notifChallengeSound: on }),
            notifChallengeSoundPath: '',
            setNotifChallengeSoundPath: (path) => set({ notifChallengeSoundPath: path }),
            notifiAtSound: true,
            setNotifAtSound: (on) => set({ notifiAtSound: on }),
            notifAtSoundPath: '',
            setNotifAtSoundPath: (path) => set({ notifAtSoundPath: path }),
            emulatorPath: '',
            setEmulatorPath: (path) => set({ emulatorPath: path }),
            darkMode: true,
            setDarkMode: (on) => set({ darkMode: on }),
            theme: { colorPalette: 'orange', name: 'Orange Soda' },
            setTheme: (t) => set({ theme: t }),
            trainingPath: '',
            setTrainingPath: (path) => set({ trainingPath: path }),
            appLanguage: '',
            setAppLanguage: (code) => set({ appLanguage: code }),
        }),
        {
            name: 'settings',
            storage: createJSONStorage(() => localStorage),
            // optional: only persist selected fields
            // partialize: (s) => ({ theme: s.theme }),
        }
    )
)

