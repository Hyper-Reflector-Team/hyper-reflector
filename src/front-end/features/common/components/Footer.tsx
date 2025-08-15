import { Box, Text } from '@chakra-ui/react'

import { FC } from 'react'
import { Theme } from '@features/common/utils/theme'

interface FooterProps {
    theme: Theme
}

const Footer: FC<FooterProps> = ({ theme }) => {
    return (
        <Box
            h="40px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            bg={theme.colors.main.secondary}
            px="4"
            flexShrink={0}
        >
            <Box display="flex" gap="8px">
                <a href="https://hyper-reflector.com/" target="_blank" rel="noreferrer">
                    <Text textStyle="xs" color={theme.colors.main.action}>
                        Hyper Reflector on:
                    </Text>
                </a>
                <a href="https://discord.gg/fsQEVzXwbt" target="_blank" rel="noreferrer">
                    <Text textStyle="xs" color={theme.colors.main.action}>
                        Discord
                    </Text>
                </a>
                <a href="https://github.com/Hyper-Reflector-Team" target="_blank" rel="noreferrer">
                    <Text textStyle="xs" color={theme.colors.main.action}>
                        Github
                    </Text>
                </a>
            </Box>

            <Text textStyle="xs" color={theme.colors.main.action}>
                Hyper Reflector version 0.4.0a 2025
            </Text>
        </Box>
    )
}

export default Footer
