import { Box } from '@chakra-ui/react'
import { Tooltip } from '@features/common/ui/tooltip'
import { Wifi, WifiHigh, WifiLow, WifiOff } from 'lucide-react'

interface PingDisplayProps {
    peer?: {
        uid: string
        ping?: number
        countryCode?: string
    }
    userState?: {
        uid: string
        lastKnownPings?: {
            id: string
            ping: number
            countryCode: string
        }[]
    }
}

const PingDisplay = ({ peer, userState }: PingDisplayProps) => {
    const isMe = peer.uid === userState?.uid || false
    const ping = peer?.ping ?? userState?.lastKnownPings?.find((u) => u.id === peer?.uid)?.ping

    const getWifiIcon = (ping: number) => {
        if (ping < 100) {
            return <Wifi color="green" size={20} />
        }
        if (ping >= 100 && ping <= 200) {
            return <WifiHigh color="yellow" size={20} />
        }
        if (ping > 200) {
            return <WifiLow color="red" size={20} />
        }
        return <WifiOff color="gray" size={20} />
    }

    return (
        <Box display={'flex'} gap="8px">
            <Tooltip content={`${peer?.countryCode || 'Unknown'}`} openDelay={200} closeDelay={100}>
                <div>
                    <span className={`fi fi-${peer?.countryCode?.toLowerCase() || 'xx'}`} />
                </div>
            </Tooltip>
            {!isMe && (
                <Tooltip
                    content={`Estimated Ping: ${peer?.ping || 'Unknown'} ms`}
                    openDelay={200}
                    closeDelay={100}
                >
                    {getWifiIcon(ping)}
                </Tooltip>
            )}
        </Box>
    )
}

export default PingDisplay
