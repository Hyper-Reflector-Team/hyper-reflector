import type { TUser } from '../../types/user'
import { DEFAULT_LOBBY_ID } from '../../state/store'

export const FALLBACK_USER_TITLE: TUser['userTitle'] = {
    bgColor: '#1f1f24',
    border: '#37373f',
    color: '#f2f2f7',
    title: 'Contender',
}

export const MOCK_CHALLENGE_USER: TUser = {
    uid: 'mock-opponent',
    userName: 'Mock Opponent',
    accountElo: 1625,
    countryCode: 'US',
    gravEmail: '',
    knownAliases: ['TrainingBot', 'MockOpponent'],
    pingLat: 37.7749,
    pingLon: -122.4194,
    userEmail: 'mock@hyper-reflector.test',
    userProfilePic: '',
    userTitle: { ...FALLBACK_USER_TITLE, title: 'Training Partner' },
    winstreak: 0,
}

export const MOCK_CHALLENGE_USER_TWO: TUser = {
    uid: 'mock-opponent-2',
    userName: 'Mock Challenger',
    accountElo: 1580,
    countryCode: 'JP',
    gravEmail: '',
    knownAliases: ['PracticeBot', 'MockChallenger'],
    pingLat: 35.6762,
    pingLon: 139.6503,
    userEmail: 'mock2@hyper-reflector.test',
    userProfilePic: '',
    userTitle: { ...FALLBACK_USER_TITLE, title: 'Training Rival' },
    winstreak: 0,
}

export const MOCK_CHAT_LINES = [
    'Hey @{player}, ready for a quick set?',
    'I have a new combo to test on you, @{player}.',
    'Your defense is looking sharp @{player}, mind if I poke at it?',
    'Anyone else here? Guess it is you and me @{player}.',
]

export const MOCK_CHALLENGE_LINES = [
    'wants to run a FT3 if you are up for it.',
    'is sending over a challenge request right now.',
    'thinks you owe them a rematch.',
]

export const MOCK_ACTION_INTERVAL_MS = 5000 // every 5 seconds do a random interaction

export const lobbySlug = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'lobby'

export const buildMockForLobby = (lobbyId: string, index = 0): TUser | null => {
    const normalized = lobbyId.trim()
    if (!normalized.length) return null

    if (normalized === DEFAULT_LOBBY_ID) {
        return index % 2 === 0 ? MOCK_CHALLENGE_USER : MOCK_CHALLENGE_USER_TWO
    }

    const slug = lobbySlug(normalized)
    const aliasPrefix = normalized.split(' ')[0] || 'Rival'
    const baseElo = 1500 + Math.min(slug.length * 23, 300)

    return {
        uid: `mock-${slug}`,
        userName: `${normalized} Rival`,
        accountElo: baseElo,
        countryCode: 'GB',
        gravEmail: '',
        knownAliases: [`${aliasPrefix}Rival`, `${aliasPrefix}Bot`],
        pingLat: 51.5072,
        pingLon: -0.1276,
        userEmail: `mock+${slug}@hyper-reflector.test`,
        userProfilePic: '',
        userTitle: {
            ...FALLBACK_USER_TITLE,
            title: 'Local Challenger',
        },
        winstreak: 0,
    }
}

export const normalizeSocketUser = (candidate: any): TUser | null => {
    if (!candidate || typeof candidate.uid !== 'string') {
        return null
    }

    const uid = candidate.uid.trim()
    if (!uid.length) {
        return null
    }

    const aliases = Array.isArray(candidate.knownAliases)
        ? candidate.knownAliases
            .map((alias: unknown) => (typeof alias === 'string' ? alias.trim() : ''))
            .filter((alias: string): alias is string => Boolean(alias.length))
        : []

    const titleSource =
        candidate.userTitle && typeof candidate.userTitle === 'object'
            ? candidate.userTitle
            : FALLBACK_USER_TITLE

    const userTitle = {
        bgColor:
            typeof titleSource.bgColor === 'string' && titleSource.bgColor.length
                ? titleSource.bgColor
                : FALLBACK_USER_TITLE.bgColor,
        border:
            typeof titleSource.border === 'string' && titleSource.border.length
                ? titleSource.border
                : FALLBACK_USER_TITLE.border,
        color:
            typeof titleSource.color === 'string' && titleSource.color.length
                ? titleSource.color
                : FALLBACK_USER_TITLE.color,
        title:
            typeof titleSource.title === 'string' && titleSource.title.length
                ? titleSource.title
                : FALLBACK_USER_TITLE.title,
    }

    return {
        uid,
        userName:
            typeof candidate.userName === 'string' && candidate.userName.trim().length
                ? candidate.userName.trim()
                : uid,
        accountElo:
            typeof candidate.accountElo === 'number' && Number.isFinite(candidate.accountElo)
                ? candidate.accountElo
                : 0,
        countryCode:
            typeof candidate.countryCode === 'string' && candidate.countryCode.trim().length
                ? candidate.countryCode.trim().toUpperCase()
                : 'XX',
        gravEmail:
            typeof candidate.gravEmail === 'string'
                ? candidate.gravEmail
                : typeof candidate.email === 'string'
                    ? candidate.email
                    : '',
        knownAliases: aliases,
        pingLat: typeof candidate.pingLat === 'number' ? candidate.pingLat : 0,
        pingLon: typeof candidate.pingLon === 'number' ? candidate.pingLon : 0,
        userEmail:
            typeof candidate.userEmail === 'string'
                ? candidate.userEmail
                : typeof candidate.email === 'string'
                    ? candidate.email
                    : '',
        userProfilePic:
            typeof candidate.userProfilePic === 'string' ? candidate.userProfilePic : '',
        userTitle,
        winstreak:
            typeof candidate.winstreak === 'number'
                ? candidate.winstreak
                : typeof candidate.winStreak === 'number'
                    ? candidate.winStreak
                    : 0,
    }
}

export const appendMockUser = (users: TUser[], lobbyId: string): TUser[] => {
    const candidateUsers = [MOCK_CHALLENGE_USER, MOCK_CHALLENGE_USER_TWO]

    const existingIds = new Set(users.map((user) => user.uid))
    const mocksToAdd = candidateUsers.filter((mock) => !existingIds.has(mock.uid))

    if (!mocksToAdd.length) {
        return users
    }

    const expanded = [...users]
    mocksToAdd.forEach((mock) => {
        expanded.push({
            ...mock,
            userTitle: { ...mock.userTitle },
            knownAliases: [...mock.knownAliases],
        })
    })

    return expanded
}
