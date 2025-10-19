import { Avatar, Box, Text } from '@chakra-ui/react'
import { Tooltip } from '../chakra/ui/tooltip'
import { useUserStore } from '../../state/store'
import '/node_modules/flag-icons/css/flag-icons.min.css'

export default function UserCard() {
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    const globalUser = useUserStore((s) => s.globalUser)
    const signalStatus = useUserStore((s) => s.signalStatus)

    const statusColorMap = {
        connected: 'green.400',
        connecting: 'yellow.400',
        error: 'red.400',
        disconnected: 'gray.400',
    } as const

    const statusLabelMap = {
        connected: 'WS Connected',
        connecting: 'WS Connecting…',
        error: 'WS Error',
        disconnected: 'WS Offline',
    } as const

    const statusColor = statusColorMap[signalStatus] ?? statusColorMap.disconnected
    const statusLabel = statusLabelMap[signalStatus] ?? statusLabelMap.disconnected

    return (
        <Box>
            {globalLoggedIn && (
                <Box
                    display="flex"
                    alignItems={'center'}
                    gap={'2'}
                    padding={'2'}
                    marginRight={'24px'}
                >
                    <Avatar.Root variant="outline" size={'sm'}>
                        <Avatar.Fallback name={globalUser?.userName} />
                        <Avatar.Image src={globalUser?.userProfilePic} />
                    </Avatar.Root>
                    <Box>{globalUser?.userName}</Box>
                    <Tooltip
                        content={`${globalUser?.countryCode || 'Unknown'}`}
                        openDelay={200}
                        closeDelay={100}
                    >
                        <div>
                            <span
                                //  @ts-ignore // this is needed for the country code css library.
                                class={`fi fi-${globalUser?.countryCode?.toLowerCase() || 'xx'}`}
                            />
                        </div>
                    </Tooltip>
                    <Box display="flex" alignItems="center" gap="1">
                        <Box
                            width="10px"
                            height="10px"
                            borderRadius="9999px"
                            backgroundColor={statusColor}
                        />
                        <Text fontSize="xs" color="gray.400">
                            {statusLabel}
                        </Text>
                    </Box>
                </Box>
            )}
        </Box>
    )
}
