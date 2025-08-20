// import { create } from 'zustand'

// export const useLayoutStore = create((set) => ({
//     selectedTab: 'login',
//     setSelectedTab: (tab: string) =>
//         set({
//             selectedTab: tab,
//         }),
//     appTheme: getThemeList()[0],
//     setTheme: (themeName: string) =>
//         set((state) => ({
//             appTheme:
//                 getThemeList().find((t) => {
//                     return t.name === themeName
//                 }) || getThemeList()[0], // fallback to a default theme
//         })),
// }))