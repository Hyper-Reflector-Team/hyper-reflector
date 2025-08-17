import { Stack } from '@chakra-ui/react'

interface SideBarProps {
    children: React.ReactNode
    width?: string
}

const SideBar = ({ children, width }: SideBarProps) => {
    return (
        <Stack overflowY="auto" w={width} scrollbarWidth={'thin'}>
            {children}
        </Stack>
    )
}

export default SideBar
