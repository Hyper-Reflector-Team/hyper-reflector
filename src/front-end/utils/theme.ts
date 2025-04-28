const slimeTheme = {
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
        },
    },
}

const orangeTheme = {
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
        },
    },
}

const pinkTheme = {
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
        },
    },
}

const pinkTheme2 = {
    name: 'Aegis Reflector Dark',
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
        },
    },
}

const purpleTheme = {
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
        },
    },
}

const greenTheme = {
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
        },
    },
}

let theme = { ...slimeTheme } // Non stateful fallback

const getThemeList = () => {
    return [slimeTheme, pinkTheme, pinkTheme2, purpleTheme, greenTheme, orangeTheme]
}

const getThemeNameList = (): string[] => {
    const themeNames = getThemeList().map((t) => t.name)
    return themeNames
}

export { getThemeList, getThemeNameList }

export default theme
