import { Stack } from '@chakra-ui/react'

export default function SideBar({ children, width }) {
    return <Stack width={width}>{children}</Stack>
}
