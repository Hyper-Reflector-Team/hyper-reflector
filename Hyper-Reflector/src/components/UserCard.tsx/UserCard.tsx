import { Avatar, Box } from '@chakra-ui/react'
import { Tooltip } from '../chakra/ui/tooltip'
import { useUserStore } from '../../state/store'
import '/node_modules/flag-icons/css/flag-icons.min.css'

export default function UserCard() {
    const globalLoggedIn = useUserStore((s) => s.globalLoggedIn)
    const globalUser = useUserStore((s) => s.globalUser)

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
                </Box>
            )}
        </Box>
    )
}

