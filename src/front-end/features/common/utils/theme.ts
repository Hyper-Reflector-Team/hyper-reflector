export interface ThemeColorsMain {
    bg: string
    secondary: string
    tertiary: string
    panel: string
    text: string
    textDark: string
    textMedium: string
    textSubdued: string
    action: string
    actionLight: string
    actionDark: string
    actionSecondary: string
    actionSecondaryLight: string
    actionSecondaryDark: string
    card: string
    cardLight: string
    cardDark: string
    warning: string
    caution: string
    success: string
    sa1: string
    sa2: string
    sa3: string
    active: string
    away: string
}

export interface ThemeColors {
    main: ThemeColorsMain
}

export interface Theme {
    name: string
    colors: ThemeColors
}

const hrTheme: Theme = {
    name: 'Hyper Reflector',
    colors: {
        main: {
            bg: 'gray.900',
            secondary: 'gray.700',
            tertiary: 'gray.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'pink.600',
            actionLight: 'pink.400',
            actionDark: 'pink.800',
            actionSecondary: 'purple.600',
            actionSecondaryLight: 'purple.400',
            actionSecondaryDark: 'purple.800',
            card: 'pink.500',
            cardLight: 'pink.400',
            cardDark: 'pink.700',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const slimeTheme: Theme = {
    name: 'Slime',
    colors: {
        main: {
            bg: 'gray.900',
            secondary: 'gray.700',
            tertiary: 'gray.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'green.600',
            actionLight: 'green.400',
            actionDark: 'green.800',
            actionSecondary: 'pink.600',
            actionSecondaryLight: 'pink.400',
            actionSecondaryDark: 'pink.800',
            card: 'gray.600',
            cardLight: 'gray.400',
            cardDark: 'gray.800',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const orangeTheme: Theme = {
    name: 'Heavy Industries',
    colors: {
        main: {
            bg: 'orange.900',
            secondary: 'orange.700',
            tertiary: 'orange.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'orange.600',
            actionLight: 'orange.400',
            actionDark: 'orange.800',
            actionSecondary: 'yellow.600',
            actionSecondaryLight: 'yellow.400',
            actionSecondaryDark: 'yellow.800',
            card: 'blue.600',
            cardLight: 'blue.400',
            cardDark: 'blue.800',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const pinkTheme: Theme = {
    name: 'Aegis Reflector',
    colors: {
        main: {
            bg: 'pink.900',
            secondary: 'pink.700',
            tertiary: 'pink.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'pink.600',
            actionLight: 'pink.400',
            actionDark: 'pink.800',
            actionSecondary: 'purple.600',
            actionSecondaryLight: 'purple.400',
            actionSecondaryDark: 'purple.800',
            card: 'pink.500',
            cardLight: 'pink.400',
            cardDark: 'pink.700',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const purpleTheme: Theme = {
    name: 'Grape Soda',
    colors: {
        main: {
            bg: 'gray.900',
            secondary: 'purple.700',
            tertiary: 'purple.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'purple.600',
            actionLight: 'purple.400',
            actionDark: 'purple.800',
            actionSecondary: 'pink.600',
            actionSecondaryLight: 'pink.400',
            actionSecondaryDark: 'pink.800',
            card: 'purple.500',
            cardLight: 'purple.400',
            cardDark: 'purple.700',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const greenTheme: Theme = {
    name: 'Booger',
    colors: {
        main: {
            bg: 'gray.900',
            secondary: 'green.700',
            tertiary: 'green.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'green.600',
            actionLight: 'green.400',
            actionDark: 'green.800',
            actionSecondary: 'purple.600',
            actionSecondaryLight: 'purple.200',
            actionSecondaryDark: 'purple.800',
            card: 'green.500',
            cardLight: 'green.400',
            cardDark: 'green.700',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const greenTheme2: Theme = {
    name: 'Yagyu',
    colors: {
        main: {
            bg: 'gray.900',
            secondary: 'green.700',
            tertiary: 'green.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'green.600',
            actionLight: 'green.400',
            actionDark: 'green.800',
            actionSecondary: 'orange.600',
            actionSecondaryLight: 'orange.200',
            actionSecondaryDark: 'orange.800',
            card: 'green.500',
            cardLight: 'green.400',
            cardDark: 'green.700',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const evilTheme: Theme = {
    name: 'Deadly',
    colors: {
        main: {
            bg: 'gray.900',
            secondary: 'gray.700',
            tertiary: 'gray.600',
            panel: 'gray.900',
            text: 'gray.100',
            textDark: 'gray.900',
            textMedium: 'gray.400',
            textSubdued: 'gray.200',
            action: 'red.600',
            actionLight: 'red.400',
            actionDark: 'red.800',
            actionSecondary: 'red.500',
            actionSecondaryLight: 'red.300',
            actionSecondaryDark: 'gray.800',
            card: 'red.500',
            cardLight: 'red.400',
            cardDark: 'red.700',
            warning: 'red.700',
            caution: 'yellow.600',
            success: 'green.500',
            sa1: 'yellow.500',
            sa2: 'orange.500',
            sa3: 'blue.500',
            active: 'green.500',
            away: 'orange.500',
        },
    },
}

const theme = { ...hrTheme } // Non stateful fallback

const getThemeList = () => {
    return [
        hrTheme,
        slimeTheme,
        pinkTheme,
        purpleTheme,
        greenTheme,
        greenTheme2,
        orangeTheme,
        evilTheme,
    ]
}

const getThemeNameList = (): string[] => {
    const themeNames = getThemeList().map((t) => t.name)
    return themeNames
}

const getThemeByIndex = (index: number) => {
    const themes = getThemeList()
    if (index < 0 || index >= themes.length) {
        return hrTheme // Fallback to default theme
    }
    return themes[index]
}

export { getThemeList, getThemeNameList, getThemeByIndex }

export default theme
