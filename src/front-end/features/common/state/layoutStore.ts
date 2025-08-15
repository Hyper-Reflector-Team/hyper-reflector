import { create } from 'zustand'
import { getThemeList, Theme } from '../utils/theme'

interface LayoutState {
    selectedTab: string
    setSelectedTab: (tab: string) => void
    appTheme: Theme
    setTheme: (themeName: string) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
    selectedTab: 'login',
    setSelectedTab: (tab) => set({ selectedTab: tab }),
    appTheme: getThemeList()[0],
    setTheme: (themeName) =>
        set({
            appTheme: getThemeList().find((t) => t.name === themeName) || getThemeList()[0],
        }),
}))
