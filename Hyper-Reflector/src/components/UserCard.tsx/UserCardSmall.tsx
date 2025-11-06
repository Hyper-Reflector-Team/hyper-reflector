import { Avatar, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { Tooltip } from '../chakra/ui/tooltip'
import '/node_modules/flag-icons/css/flag-icons.min.css'
import { TUser } from '../../types/user'
import TitleBadge from './TitleBadge'

type UserCardSmallProps = {
    user: TUser | undefined
    isSelf?: boolean
    onChallenge?: (user: TUser) => void
}

export default function UserCardSmall({ user, isSelf, onChallenge }: UserCardSmallProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const isInteractive = Boolean(!isSelf && user)

    useEffect(() => {
        setMenuOpen(false)
    }, [user?.uid])

    if (!user) {
        return null
    }

    const toggleMenu = () => {
        if (!isInteractive) return
        setMenuOpen((prev) => !prev)
    }

    const handleKeyToggle = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive) return
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggleMenu()
        }
    }

    const handleChallenge = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        if (!isInteractive || !onChallenge) return
        onChallenge(user)
        setMenuOpen(false)
    }

    return (
        <Stack
            spacing="1"
            borderWidth="1px"
            borderColor="gray.700"
            borderRadius="md"
            bg="bg.canvas"
            _hover={isInteractive ? { borderColor: 'gray.500' } : undefined}
        >
            <Flex
                alignItems="center"
                gap="2"
                padding="2"
                cursor={isInteractive ? 'pointer' : 'default'}
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive ? 0 : -1}
                onClick={toggleMenu}
                onKeyDown={handleKeyToggle}
            >
                <Avatar.Root variant="outline" size="xs">
                    <Avatar.Fallback name={user.userName} />
                    <Avatar.Image src={user.userProfilePic} />
                </Avatar.Root>
                <Stack spacing="0">
                    <Text fontWeight="semibold" fontSize="sm">
                        {user.userName}
                    </Text>
                    <TitleBadge title={user.userTitle} />
                    <Text fontSize="xs" color="gray.500">
                        {isSelf ? 'This is you' : `ELO ${user.accountElo}`}
                    </Text>
                </Stack>
                <Tooltip content={`${user.countryCode || 'Unknown'}`} openDelay={200} closeDelay={100}>
                    <div>
                        <span
                            //  @ts-ignore // this is needed for the country code css library.
                            class={`fi fi-${user.countryCode?.toLowerCase() || 'xx'}`}
                        />
                    </div>
                </Tooltip>
            </Flex>
            {menuOpen && isInteractive ? (
                <Box paddingX="3" paddingBottom="3">
                    <Stack spacing="2">
                        {user.knownAliases.length ? (
                            <Text fontSize="xs" color="gray.400">
                                Also known as: {user.knownAliases.join(', ')}
                            </Text>
                        ) : null}
                        <Button size="sm" colorPalette="orange" onClick={handleChallenge}>
                            Challenge player
                        </Button>
                    </Stack>
                </Box>
            ) : null}
        </Stack>
    )
}
