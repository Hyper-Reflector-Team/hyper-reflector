import { Stack } from '@chakra-ui/react'
import { FC } from 'react'

interface SideBarProps {
    children: React.ReactNode
    width?: string
}

const SideBar: FC<SideBarProps> = ({ children, width }) => {
    return (
        <Stack overflowY="auto" w={width} scrollbarWidth={'thin'}>
            {children}
        </Stack>
    )
}

export default SideBar
