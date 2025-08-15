import { create } from 'zustand'

interface ConfigStateType {
    appSoundOn: string
    isAway: string
}

interface ConfigState {
    configState: ConfigStateType
    setConfigState: (data: ConfigStateType) => void
    updateConfigState: (data: Partial<ConfigStateType>) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
    configState: { appSoundOn: 'true', isAway: 'false' },
    setConfigState: (data) => set({ configState: data }),
    updateConfigState: (data) =>
        set((state) => ({ configState: { ...state.configState, ...data } })),
}))
