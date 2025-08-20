import { Box, Stack } from '@chakra-ui/react'
import { ReactElement } from 'react'

export default function Layout({ children }: { children: ReactElement[] }) {
    return (
        <Stack>
            <Box>
                layout
                <Box flex="1" display="flex" flexDirection="column" height="calc(100vh - 120px)">
                    <Box flex="1" overflowY="auto" p="4" scrollbarWidth={'thin'}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </Stack>
    )
}
