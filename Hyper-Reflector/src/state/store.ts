import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TUser } from '../types/user'

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
    theme: string
    setTheme: (t: string) => void
    emulatorPath: string
    setEmulatorPath: (path: string) => void
}

type UserState = {
    globalUser: TUser | undefined
    globalLoggedIn: boolean
    setGlobalUser: (user: TUser | undefined) => void
    setGlobalLoggedIn: (info: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
    globalUser: undefined,
    globalLoggedIn: false,
    setGlobalUser: (user) => set({ globalUser: user }),
    setGlobalLoggedIn: (info) => set({ globalLoggedIn: info }),
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
            theme: 'dark',
            setTheme: (t) => set({ theme: t }),
        }),
        {
            name: 'settings',
            storage: createJSONStorage(() => localStorage),
            // optional: only persist selected fields
            // partialize: (s) => ({ theme: s.theme }),
        }
    )
)