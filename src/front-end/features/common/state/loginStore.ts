import { create } from 'zustand'

interface UserState {
    email: string
    isFighting: boolean
    currentLobbyId?: string
}

interface LoginState {
    userState: UserState
    isLoggedIn: boolean
    successLogin: () => void
    failedLogin: () => void
    loggedOut: () => void
    setUserState: (data: UserState) => void
    updateUserState: (data: Partial<UserState>) => void
}

export const useLoginStore = create<LoginState>((set) => ({
    userState: { email: '', isFighting: false, currentLobbyId: null },
    isLoggedIn: false,
    successLogin: () => set({ isLoggedIn: true }),
    failedLogin: () => set({ isLoggedIn: false }),
    loggedOut: () => set({ isLoggedIn: false }),
    setUserState: (data) => set({ userState: data }),
    updateUserState: (data) => set((state) => ({ userState: { ...state.userState, ...data } })),
}))
