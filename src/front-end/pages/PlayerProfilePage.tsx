import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
    IconButton,
    ButtonGroup,
    Stack,
    Text,
    Heading,
    Box,
    Center,
    Spinner,
    Pagination,
    Skeleton,
    Editable,
    Button,
    createListCollection,
} from '@chakra-ui/react'
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '../components/chakra/ui/select'
import {
    ChartBar,
    Check,
    ChevronLeft,
    ChevronRight,
    Construction,
    Joystick,
    Pencil,
    UserRound,
    Wrench,
    X,
} from 'lucide-react'
import { Field } from '../components/chakra/ui/field'
import { toaster } from '../components/chakra/ui/toaster'
import { useLoginStore, useLayoutStore } from '../state/store'

import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity'

import SideBar from '../components/general/SideBar'
import MatchSetCard from '../components/users/MatchSetCard'
import TitleBadge from '../components/users/TitleBadge'

const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
})

//TODO: user should have to click a button to save all data
export default function PlayerProfilePage() {
    const theme = useLayoutStore((state) => state.appTheme)
    const { userId } = useParams({ strict: false })
    const userState = useLoginStore((state) => state.userState)
    const updateUserState = useLoginStore((state) => state.updateUserState)
    const [currentTab, setCurrentTab] = useState<number>(0)
    const [editedUserName, setEditedUserName] = useState(undefined)
    const [isEditName, setIsEditName] = useState(false)
    const [nameInvalid, setNameInvalid] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [recentMatches, setRecentMatches] = useState([])
    const [userData, setUserData] = useState([])
    const [lastMatch, setLastMatch] = useState(null)
    const [firstMatch, setFirstMatch] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [pageCount, setPageCount] = useState(null)
    const [isBack, setIsBack] = useState(false)
    const [matchTotal, setMatchTotal] = useState(undefined)
    const [selectedMatchDetails, setSelectedMatchDetails] = useState(undefined)
    const [titleList, setTitleList] = useState(undefined)
    const [selectedTitle, setSelectedTitle] = useState(undefined)

    // used when switching tabs etc
    const resetState = () => {
        setMatchTotal(undefined)
        setIsBack(false)
        setPageCount(null)
        setPageNumber(1)
        setFirstMatch(null)
        setLastMatch(null)
        setRecentMatches([])
        setEditedUserName(undefined)
        setIsEditName(false)
        setSelectedMatchDetails(undefined)
    }

    const handleSetRecentMatches = (matchData) => {
        const { matches, lastVisible, totalMatches, firstVisible } = matchData
        // only set this once
        if (!matchTotal) {
            setMatchTotal(totalMatches)
            setPageCount(Math.ceil(totalMatches / 10))
        }
        setFirstMatch(firstVisible)
        setLastMatch(lastVisible)
        setRecentMatches(matches)
        setIsLoading(false)
    }

    const handleSetUserData = (data) => {
        setUserData(data)
        setEditedUserName(data.userName)
    }

    useEffect(() => {
        // use effects when we switch tabs
        // public profile
        if (currentTab === 0) {
            window.api.getAllTitles({ userId })
            setIsLoading(true)
            window.api.getUserData(userId)
        }
        // recent matches
        if (currentTab === 1) {
            setIsLoading(true)
            // window.api.getUserMatches({ userId, lastMatchId: lastMatch })
            if (isBack) {
                window.api.getUserMatches({ userId, firstMatchId: firstMatch })
                setIsBack(false)
            } else {
                setIsBack(false)
                window.api.getUserMatches({ userId, lastMatchId: lastMatch })
            }
        }
        // public profile
        if (currentTab === 2) {
            setIsLoading(true)
            setIsLoading(false)
        }
    }, [currentTab, pageNumber])

    useEffect(() => {
        if (currentTab === 0 || currentTab === 3) {
            setIsLoading(false)
        }
    }, [userData])

    useEffect(() => {
        // if we are on the matches tab we want to wait until the full load is completed
        if (currentTab === 1) {
            setIsLoading(false)
        }
    }, [firstMatch])

    const handleSetTitles = (data) => {
        const titles = createListCollection({
            items: [
                ...data?.titleData?.titles.map((title, index) => {
                    return { label: title.title, value: index, data: title }
                }),
            ],
        })
        setTitleList(titles)
    }

    useEffect(() => {
        if (!titleList?.items) return
        const newTitle = titleList.items[selectedTitle].data
        updateUserState({ userTitle: newTitle })
        window.api.changeUserData({ userTitle: newTitle })
    }, [selectedTitle])

    useEffect(() => {
        window.api.removeExtraListeners('getUserData', handleSetUserData)
        window.api.on('getUserData', handleSetUserData)

        window.api.removeExtraListeners('getUserMatches', handleSetRecentMatches)
        window.api.on('getUserMatches', handleSetRecentMatches)

        window.api.removeExtraListeners('fillGlobalSet', globalSetDataFill)
        window.api.on('fillGlobalSet', globalSetDataFill)

        window.api.removeExtraListeners('fillAllTitles', handleSetTitles)
        window.api.on('fillAllTitles', handleSetTitles)

        return () => {
            window.api.removeListener('getUserData', handleSetUserData)
            window.api.removeListener('getUserMatches', handleSetRecentMatches)
            window.api.removeListener('fillGlobalSet', globalSetDataFill)
            window.api.removeListener('fillAllTitles', handleSetTitles)
        }
    }, [])

    const globalSetDataFill = ({ globalSet }) => {
        if (globalSet) {
            setSelectedMatchDetails(globalSet)
        } else {
            console.log('test')
            toaster.error({
                title: 'Failed to load set!',
            })
            setSelectedMatchDetails({ matches: [] })
        }
    }

    const getSuperArt = (code) => {
        switch (parseInt(code)) {
            case 0:
                return 'SAI'
                break
            case 1:
                return 'SAII'
                break
            case 2:
                return 'SAIII'
                break
            default:
                return 'SAI'
                break
        }
    }

    const RenderSuperArt = ({ code }) => {
        const currentSuper = getSuperArt(code)
        let superColor
        if (code === 0) {
            superColor = 'yellow.500'
        } else if (code === 1) {
            superColor = 'orange.500'
        } else if (code === 2) {
            superColor = 'blue.500'
        }
        return (
            <Text textStyle="md" padding="8px" color={superColor} width={'60px'}>
                {currentSuper}
            </Text>
        )
    }

    useEffect(() => {
        setNameInvalid(true)
    }, [editedUserName])

    return (
        <Box display="flex" gap="12px">
            <SideBar width="160px">
                <Button
                    disabled={currentTab === 0}
                    justifyContent="flex-start"
                    bg={theme.colors.main.secondary}
                    onClick={() => setCurrentTab(0)}
                >
                    <UserRound />
                    Profile
                </Button>
                <Button
                    disabled={currentTab === 1}
                    justifyContent="flex-start"
                    bg={theme.colors.main.secondary}
                    onClick={() => {
                        resetState()
                        setCurrentTab(1)
                    }}
                >
                    <Joystick />
                    Recent Matches
                </Button>
                {userData?.uid === userState.uid ? (
                    <Button
                        disabled={currentTab === 2}
                        justifyContent="flex-start"
                        bg={theme.colors.main.secondary}
                        onClick={() => setCurrentTab(2)}
                    >
                        <ChartBar />
                        Statistics
                    </Button>
                ) : null}
                {userData?.uid === userState.uid ? (
                    <Button
                        disabled={currentTab === 3}
                        justifyContent="flex-start"
                        bg={theme.colors.main.secondary}
                        onClick={() => {
                            resetState()
                            setCurrentTab(3)
                        }}
                    >
                        <Wrench />
                        User Setting
                    </Button>
                ) : null}
            </SideBar>

            <Stack minH="100%" maxWidth={'600px'} flex={1}>
                {currentTab === 0 && (
                    <Box>
                        {/* <Box color={theme.colors.main.actionSecondary} display="flex" gap="12px">
                            <Construction />
                        </Box> */}
                        {/* <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            {JSON.stringify(userData)}
                        </Text> */}
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            {userData?.userName || 'Unknown User'}
                            <TitleBadge title={userState?.userTitle || userData?.userTitle} />
                        </Text>
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            Current Win Streak: 10
                        </Text>
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            Total Games: 10
                        </Text>
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            Wins: 10
                        </Text>
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            Losses: 3
                        </Text>
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            Win rate 70%
                        </Text>
                        <Text textStyle="md" padding="8px" color={theme.colors.main.textMedium}>
                            Character: Elena
                        </Text>
                    </Box>
                )}

                {currentTab === 1 && (
                    <Box>
                        <Stack>
                            <Stack>
                                <Heading flex="0" size="md" color={theme.colors.main.textSubdued}>
                                    Recent Matches
                                </Heading>
                                {matchTotal && (
                                    <Box>
                                        <Text
                                            textStyle="md"
                                            padding="8px"
                                            color={theme.colors.main.textMedium}
                                        >
                                            Total Matches Played: {matchTotal}
                                        </Text>
                                        <Pagination.Root
                                            color={theme.colors.main.action}
                                            count={matchTotal}
                                            pageSize={10}
                                            defaultPage={1}
                                            onPageChange={(event) => {
                                                setIsLoading(true)
                                                if (event.page <= 1) {
                                                    setLastMatch(null)
                                                } else if (pageNumber > event.page) {
                                                    setIsBack(true)
                                                }
                                                setPageNumber(event.page)
                                            }}
                                        >
                                            <ButtonGroup gap="4" size="sm" variant="ghost">
                                                <Pagination.PrevTrigger asChild>
                                                    <IconButton color={theme.colors.main.action}>
                                                        <ChevronLeft />
                                                    </IconButton>
                                                </Pagination.PrevTrigger>
                                                <Text textStyle="md" padding="8px">
                                                    {pageNumber} of {pageCount}
                                                </Text>
                                                <Pagination.NextTrigger asChild>
                                                    <IconButton color={theme.colors.main.action}>
                                                        <ChevronRight />
                                                    </IconButton>
                                                </Pagination.NextTrigger>
                                            </ButtonGroup>
                                        </Pagination.Root>
                                    </Box>
                                )}
                                {recentMatches &&
                                    recentMatches.map((match, index) => {
                                        return (
                                            <MatchSetCard
                                                recentMatches={recentMatches}
                                                key={index}
                                                match={match}
                                                index={index}
                                                isLoading={isLoading}
                                                RenderSuperArt={RenderSuperArt}
                                                selectedMatchDetails={selectedMatchDetails}
                                            />
                                        )
                                    })}
                            </Stack>
                        </Stack>
                    </Box>
                )}
                {currentTab === 2 && (
                    <Box>
                        <Box color={theme.colors.main.actionSecondary} display="flex" gap="12px">
                            <Construction />
                            Under Construction
                        </Box>
                    </Box>
                )}

                {currentTab === 3 && (
                    <Box>
                        <Text textStyle="xs" color={theme.colors.main.textMedium}>
                            Profile changes are not visible to others until the next time you log
                            in.
                        </Text>
                        <Editable.Root
                            defaultValue={userData?.userName}
                            maxLength={16}
                            onEditChange={(e) => setIsEditName(e.edit)}
                            onValueCommit={(e) => {
                                const censor = new TextCensor()
                                const nameMatch = e.value
                                const matches = matcher.getAllMatches(nameMatch)
                                const censoredMessage = censor.applyTo(nameMatch, matches)
                                setEditedUserName(censoredMessage)
                                updateUserState({ name: censoredMessage })
                                window.api.changeUserData({ userName: censoredMessage })
                            }}
                            onValueChange={(e) => setEditedUserName(e.value)}
                            onValueRevert={(e) => {
                                setEditedUserName(e.value)
                                updateUserState({ name: e.value })
                            }}
                            value={editedUserName}
                            invalid={editedUserName && editedUserName.length <= 1 && nameInvalid}
                        >
                            {!isEditName && (
                                <Heading
                                    flex="1"
                                    size="lg"
                                    color={theme.colors.main.actionSecondary}
                                    width="100px"
                                    height="36px"
                                >
                                    {editedUserName || userData?.userName ? (
                                        editedUserName || userData?.userName
                                    ) : (
                                        <Skeleton height="24px" />
                                    )}
                                </Heading>
                            )}

                            <Editable.Input
                                id="test"
                                bg={theme.colors.main.textSubdued}
                                height="36px"
                                value={editedUserName}
                            />
                            {userData?.uid === userState.uid && (
                                <Editable.Control>
                                    <Editable.EditTrigger asChild>
                                        <IconButton
                                            variant="ghost"
                                            size="xs"
                                            color={theme.colors.main.action}
                                        >
                                            <Pencil />
                                        </IconButton>
                                    </Editable.EditTrigger>
                                    <Editable.CancelTrigger asChild>
                                        <IconButton
                                            variant="outline"
                                            size="xs"
                                            color={theme.colors.main.action}
                                        >
                                            <X />
                                        </IconButton>
                                    </Editable.CancelTrigger>
                                    <Editable.SubmitTrigger asChild>
                                        <IconButton
                                            variant="outline"
                                            size="xs"
                                            color={theme.colors.main.action}
                                        >
                                            <Check />
                                        </IconButton>
                                    </Editable.SubmitTrigger>
                                </Editable.Control>
                            )}
                        </Editable.Root>
                        <TitleBadge title={userState?.userTitle || userData?.userTitle} />
                        <Field
                            marginTop={'8px'}
                            label=""
                            helperText="Title flair to display to other users"
                            color={theme.colors.main.textMedium}
                        >
                            <SelectRoot
                                color={theme.colors.main.actionSecondary}
                                collection={titleList || []}
                                value={selectedTitle}
                                onValueChange={(e) => setSelectedTitle(e.value)}
                            >
                                <SelectTrigger>
                                    <SelectValueText placeholder="Change Title" />
                                </SelectTrigger>
                                <SelectContent>
                                    {titleList?.items.map((title) => (
                                        <SelectItem item={title} key={title.value}>
                                            {title.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        </Field>
                    </Box>
                )}

                {isLoading && (
                    <Box pos="absolute" inset="0" bg={theme.colors.main.bg} opacity="50%">
                        <Center h="full">
                            <Spinner color={theme.colors.main.action} />
                        </Center>
                    </Box>
                )}
            </Stack>
        </Box>
    )
}
