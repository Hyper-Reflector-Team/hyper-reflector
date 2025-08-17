import { Box, Icon, Text } from '@chakra-ui/react'
import { useLayoutStore } from '@features/common/state'
import { Crown } from 'lucide-react'

interface RankDisplayProps {
    elo: number | null | undefined
}

const RankDisplay = ({ elo }: RankDisplayProps) => {
    const theme = useLayoutStore((state) => state.appTheme)

    if (!elo) return

    if (elo < 1100) {
        return (
            <Box alignContent="center" width="40px" textAlign="center">
                <Icon as={Crown} w={5} h={5} color="yellow.800" />
                <Text textStyle="xs" fontWeight="bold" color={theme.colors.main.text}>
                    {elo}
                </Text>
            </Box>
        )
    }
    if (elo <= 1400) {
        return (
            <Box alignContent="center" width="40px" textAlign="center">
                <Icon as={Crown} w={5} h={5} color="green.600" />
                <Text textStyle="xs" fontWeight="bold" color={theme.colors.main.text}>
                    {elo}
                </Text>
            </Box>
        )
    }
    return (
        <Box alignContent="center" width="40px" textAlign="center">
            <Icon as={Crown} w={5} h={5} color="yellow.400" />
            <Text textStyle="xs" fontWeight="bold" color={theme.colors.main.text}>
                {elo}
            </Text>
        </Box>
    )
}

export default RankDisplay
