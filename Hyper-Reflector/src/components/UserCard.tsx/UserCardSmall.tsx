import { Avatar, Box } from '@chakra-ui/react'
import { Tooltip } from '../chakra/ui/tooltip'
import '/node_modules/flag-icons/css/flag-icons.min.css'
import { TUser } from '../../types/user'

export default function UserCardSmall({ user }: { user: TUser | undefined }) {
    return (
        <Box>
            <Box
                display="flex"
                alignItems={'center'}
                gap={'2'}
                padding={'2'}
                // marginRight={'24px'}
            >
                <Avatar.Root variant="outline" size={'xs'}>
                    <Avatar.Fallback name={user.userName} />
                    <Avatar.Image src={user?.userProfilePic} />
                </Avatar.Root>
                <Box>{user?.userName}</Box>
                <Tooltip
                    content={`${user?.countryCode || 'Unknown'}`}
                    openDelay={200}
                    closeDelay={100}
                >
                    <div>
                        <span
                            //  @ts-ignore // this is needed for the country code css library.
                            class={`fi fi-${user?.countryCode?.toLowerCase() || 'xx'}`}
                        />
                    </div>
                </Tooltip>
            </Box>
        </Box>
    )
}
