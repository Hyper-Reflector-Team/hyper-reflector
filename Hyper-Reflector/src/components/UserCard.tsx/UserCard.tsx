import { Avatar, Box } from '@chakra-ui/react'

export default function UserCard() {
    return (
        <Box display="flex" alignItems={'center'} gap={'2'} padding={'2'}>
            <Avatar.Root variant="outline" size={'md'}>
                <Avatar.Fallback name="test" />
                <Avatar.Image />
            </Avatar.Root>
            <Box>User</Box>
        </Box>
    )
}
