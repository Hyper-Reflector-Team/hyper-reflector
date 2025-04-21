import { Stack } from '@chakra-ui/react'
import theme from '../../utils/theme'

export default function SideBar({ children, width }) {
    return (
        <Stack overflowY="auto" w={width} scrollbarWidth={'thin'}>
            {children}
        </Stack>
    )
}
