import { invoke } from '@tauri-apps/api/core'
//@ts-ignore // keys exists
import keys from '../private/keys'
import { toaster } from '../components/chakra/ui/toaster'
import { useSettingsStore, useUserStore } from '../state/store'
import {
    MOCK_CHALLENGE_USER,
    MOCK_CHALLENGE_USER_TWO,
} from '../layout/helpers/mockUsers'

type ProxyMatchArgs = {
    matchId: string
    playerSlot: 0 | 1
    opponentUid: string
    serverHost?: string
    serverPort?: number
    gameName?: string | null
}

type MockMatchArgs = {
    matchId?: string
    opponentName?: string
    gameName?: string | null
    playerSlot: 0 | 1
}

const MOCK_USER_MAP = new Map([
    [MOCK_CHALLENGE_USER.uid, MOCK_CHALLENGE_USER],
    [MOCK_CHALLENGE_USER_TWO.uid, MOCK_CHALLENGE_USER_TWO],
])

export function isMockUserId(uid?: string | null): boolean {
    if (!uid) return false
    return uid.startsWith('mock-') || MOCK_USER_MAP.has(uid)
}

export async function startProxyMatch({
    matchId,
    playerSlot,
    opponentUid,
    serverHost,
    serverPort,
    gameName,
}: ProxyMatchArgs): Promise<void> {
    const { emulatorPath, ggpoDelay } = useSettingsStore.getState()
    const { globalUser } = useUserStore.getState()

    if (!globalUser?.uid) {
        toaster.error({
            title: 'Unable to start match',
            description: 'No logged in user detected.',
        })
        return
    }

    if (!emulatorPath) {
        toaster.error({
            title: 'Emulator path missing',
            description: 'Set your emulator path in settings before starting a match.',
        })
        return
    }

    const resolvedServerHost = serverHost || keys.COTURN_IP
    const parsedServerPort = Number(serverPort ?? keys.PUNCH_PORT ?? 33334)

    try {
        await invoke('start_proxy', {
            args: {
                match_id: matchId,
                my_uid: globalUser.uid,
                peer_uid: opponentUid,
                server_host: resolvedServerHost,
                server_port: parsedServerPort,
                emulator_path: emulatorPath,
                player: playerSlot + 1,
                delay: Number.parseInt(ggpoDelay || '0', 10) || 0,
                user_name: globalUser.userName || globalUser.userEmail || 'Player',
                game_name: gameName ?? null,
            },
        })
    } catch (error) {
        console.error('Failed to start proxy match:', error)
        toaster.error({
            title: 'Failed to start match',
            description: error instanceof Error ? error.message : 'Unknown error starting proxy',
        })
    }
}

export async function startMockMatch({
    matchId,
    opponentName,
    gameName,
    playerSlot,
}: MockMatchArgs): Promise<void> {
    const { emulatorPath, ggpoDelay, trainingPath } = useSettingsStore.getState()
    const { globalUser } = useUserStore.getState()

    if (!emulatorPath) {
        toaster.error({
            title: 'Emulator path missing',
            description: 'Set your emulator path in settings before starting a mock match.',
        })
        return
    }

    const playerName = globalUser?.userName || globalUser?.userEmail || 'Player 1'
    const opponentDisplayName = opponentName || 'Mock Opponent'
    const baseGameName = (gameName && gameName.trim().length ? gameName : 'sfiii3nr1') || 'sfiii3nr1'
    const delay = Number.parseInt(ggpoDelay || '0', 10) || 0

    const matchOffset = Math.abs(hashString(matchId ?? `${Date.now()}`)) % 1000
    const localBasePort = 7100 + matchOffset
    const playerOnePorts = {
        local: localBasePort,
        remote: localBasePort + 1,
    }
    const playerTwoPorts = {
        local: localBasePort + 1,
        remote: localBasePort,
    }

    const playerOneArgs = buildEmulatorArgs({
        emulatorPath,
        playerIndex: playerSlot === 0 ? 1 : 2,
        localPort: playerSlot === 0 ? playerOnePorts.local : playerTwoPorts.local,
        remotePort: playerSlot === 0 ? playerOnePorts.remote : playerTwoPorts.remote,
        playerName,
        delay,
        luaPath: trainingPath,
        gameName: baseGameName,
    })

    const playerTwoArgs = buildEmulatorArgs({
        emulatorPath,
        playerIndex: playerSlot === 0 ? 2 : 1,
        localPort: playerSlot === 0 ? playerTwoPorts.local : playerOnePorts.local,
        remotePort: playerSlot === 0 ? playerTwoPorts.remote : playerOnePorts.remote,
        playerName: opponentDisplayName,
        delay,
        luaPath: trainingPath,
        gameName: baseGameName,
    })

    try {
        await Promise.all([
            invoke('launch_emulator', {
                exe_path: emulatorPath,
                args: playerOneArgs,
            }),
            invoke('launch_emulator', {
                exe_path: emulatorPath,
                args: playerTwoArgs,
            }),
        ])
        toaster.success({
            title: 'Mock match started',
            description: 'Launched two local emulator instances.',
        })
    } catch (error) {
        console.error('Failed to start mock match:', error)
        toaster.error({
            title: 'Failed to start mock match',
            description: error instanceof Error ? error.message : 'Unknown error launching emulator',
        })
    }
}

type BuildArgsOptions = {
    emulatorPath: string
    playerIndex: 1 | 2
    localPort: number
    remotePort: number
    playerName: string
    delay: number
    luaPath?: string
    gameName: string
}

function buildEmulatorArgs({
    emulatorPath,
    playerIndex,
    localPort,
    remotePort,
    playerName,
    delay,
    luaPath,
    gameName,
}: BuildArgsOptions): string[] {
    const normalizedPath = emulatorPath.toLowerCase()
    const args: string[] = []

    if (normalizedPath.endsWith('fs-fbneo.exe') || normalizedPath.endsWith('fs-fbneo')) {
        args.push('--rom', gameName)
        if (luaPath && luaPath.trim().length) {
            args.push('--lua', luaPath)
        }
        args.push(
            'direct',
            '--player',
            String(playerIndex),
            '-n',
            playerName,
            '-l',
            `127.0.0.1:${localPort}`,
            '-r',
            `127.0.0.1:${remotePort}`,
            '-d',
            String(delay)
        )
        return args
    }

    if (normalizedPath.endsWith('fcadefbneo.exe') || normalizedPath.endsWith('fcadefbneo')) {
        const connection = `quark:direct,${gameName},${localPort},127.0.0.1,${remotePort},${playerIndex},${delay},0`
        args.push(connection)
        if (luaPath && luaPath.trim().length) {
            args.push('--lua', luaPath)
        }
        return args
    }

    if (luaPath && luaPath.trim().length) {
        args.push('--lua', luaPath)
    }

    args.push(
        '--rom',
        gameName,
        '--player',
        String(playerIndex),
        '-n',
        playerName,
        '-l',
        `127.0.0.1:${localPort}`,
        '-r',
        `127.0.0.1:${remotePort}`,
        '-d',
        String(delay)
    )

    return args
}

function hashString(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i)
        hash |= 0
    }
    return hash
}
