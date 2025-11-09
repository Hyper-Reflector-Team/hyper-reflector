import { dirname, join, normalize, resolve, resourceDir } from '@tauri-apps/api/path'
import { useSettingsStore } from '../state/store'

const isProd = () => import.meta.env.PROD
const isTauri = () => typeof window !== 'undefined' && '__TAURI__' in window

const toCliPath = (path: string) => path.replace(/\\/g, '/')
const hasValue = (value?: string | null): value is string => Boolean(value && value.trim().length)
const needsDefault = (value?: string | null) =>
    !hasValue(value) || value.startsWith('../') || value.startsWith('..\\')

const DEV_BASE = '..'
const DEV_SEGMENTS = {
    emulator: ['emu', 'hyper-screw-fbneo', 'fs-fbneo.exe'],
    training: ['lua', '3rd_training_lua', '3rd_training.lua'],
    match: ['lua', '3rd_training_lua', 'hyper_reflector.lua'],
    challenge: ['sounds', 'challenge.mp3'],
    mention: ['sounds', 'message.wav'],
}

type DefaultPaths = {
    emulator: string
    training: string
    match: string
    challenge: string
    mention: string
}

let cachedDefaults: DefaultPaths | null = null

async function toAbsolute(path: string): Promise<string> {
    try {
        const normalized = await normalize(path)
        return toCliPath(normalized)
    } catch {
        const resolved = await normalize(await resolve(path))
        return toCliPath(resolved)
    }
}

async function buildDevDefaults(): Promise<DefaultPaths> {
    const build = (segments: string[]) => toAbsolute([DEV_BASE, ...segments].join('/'))

    return {
        emulator: await build(DEV_SEGMENTS.emulator),
        training: await build(DEV_SEGMENTS.training),
        match: await build(DEV_SEGMENTS.match),
        challenge: await build(DEV_SEGMENTS.challenge),
        mention: await build(DEV_SEGMENTS.mention),
    }
}

async function buildProdDefaults(): Promise<DefaultPaths> {
    let filesBase = 'C:/Program Files/hyper-reflector/files'
    if (isTauri()) {
        try {
            const resDir = await resourceDir()
            filesBase = await normalize(await join(resDir, '..', 'files'))
        } catch {
            // fall back to default Program Files path
        }
    }

    const build = async (segments: string[]) => toCliPath(await normalize(await join(filesBase, ...segments)))

    return {
        emulator: await build(DEV_SEGMENTS.emulator),
        training: await build(DEV_SEGMENTS.training),
        match: await build(DEV_SEGMENTS.match),
        challenge: await build(DEV_SEGMENTS.challenge),
        mention: await build(DEV_SEGMENTS.mention),
    }
}

async function getDefaults(): Promise<DefaultPaths> {
    if (!cachedDefaults) {
        cachedDefaults = isProd() ? await buildProdDefaults() : await buildDevDefaults()
    }
    return cachedDefaults
}

async function deriveRelative(
    baseEmulatorPath: string | null | undefined,
    segments: string[]
): Promise<string | null> {
    if (!hasValue(baseEmulatorPath)) {
        return null
    }

    try {
        const normalized = await normalize(baseEmulatorPath)
        const dir = await dirname(normalized)
        const derived = await normalize(await join(dir, '..', '..', ...segments))
        return toCliPath(derived)
    } catch {
        return null
    }
}

export async function ensureDefaultEmulatorPath(force = false) {
    const { emulatorPath, setEmulatorPath } = useSettingsStore.getState()
    if (!force && hasValue(emulatorPath) && !needsDefault(emulatorPath)) {
        return
    }

    const defaults = await getDefaults()
    setEmulatorPath(defaults.emulator)
}

export async function ensureDefaultTrainingPath(
    emulatorPathSetting?: string | null,
    force = false
) {
    const { trainingPath, setTrainingPath } = useSettingsStore.getState()
    if (!force && hasValue(trainingPath) && !needsDefault(trainingPath)) {
        return
    }

    const derived = await deriveRelative(emulatorPathSetting, DEV_SEGMENTS.training)
    if (derived) {
        setTrainingPath(derived)
        return
    }

    const defaults = await getDefaults()
    setTrainingPath(defaults.training)
}

async function ensureSound(
    currentValue: string,
    setter: (path: string) => void,
    emulatorPathSetting: string | null | undefined,
    segments: string[],
    fallback: string
) {
    if (hasValue(currentValue) && !needsDefault(currentValue)) {
        return
    }

    const derived = await deriveRelative(emulatorPathSetting, segments)
    if (derived) {
        setter(derived)
        return
    }

    setter(fallback)
}

export async function ensureDefaultChallengeSound(emulatorPathSetting?: string | null) {
    const { notifChallengeSoundPath, setNotifChallengeSoundPath } = useSettingsStore.getState()
    const defaults = await getDefaults()
    await ensureSound(
        notifChallengeSoundPath,
        setNotifChallengeSoundPath,
        emulatorPathSetting,
        DEV_SEGMENTS.challenge,
        defaults.challenge
    )
}

export async function ensureDefaultMentionSound(emulatorPathSetting?: string | null) {
    const { notifAtSoundPath, setNotifAtSoundPath } = useSettingsStore.getState()
    const defaults = await getDefaults()
    await ensureSound(
        notifAtSoundPath,
        setNotifAtSoundPath,
        emulatorPathSetting,
        DEV_SEGMENTS.mention,
        defaults.mention
    )
}

export async function resolveMatchLuaPath(emulatorPathSetting?: string | null) {
    const derived = await deriveRelative(emulatorPathSetting, DEV_SEGMENTS.match)
    if (derived) {
        return derived
    }

    const defaults = await getDefaults()
    return defaults.match
}
